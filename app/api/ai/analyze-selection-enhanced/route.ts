import { NextRequest } from "next/server";
import { streamClaudeWithThinking, ClaudeMessageWithThinking } from "@/lib/claude";
import { TEXT_ANALYSIS_PROMPT } from "@/lib/prompts-clean";
import { getSession } from "@/lib/session";
import { tavilySearch } from "@/lib/tavily-client";
import { config } from "@/lib/config";
import OpenAI from "openai";

interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  timestamp: number;
}

interface DebugEvent {
  step: string;
  timestamp: number;
  data: any;
}

export async function POST(request: NextRequest) {
  try {
    const { selectedText, messages, useWebSearch, phaseContext, sessionData } = await request.json();

    // Allow empty selectedText for direct chat mode (floating button without selection)
    if (selectedText !== undefined && typeof selectedText !== "string") {
      return new Response(JSON.stringify({ error: "Invalid selected text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use session data passed from client (sessionStorage is browser-only, so client must send it)
    // Note: We also try getSession() as a fallback for consistency with other API routes
    const effectiveSessionData = sessionData || getSession();

    // Collect debug events for transparent UI output
    const debugEvents: DebugEvent[] = [];

    // Debug logging to verify context is available
    console.log("[AI Insight] Phase:", phaseContext?.phase);
    console.log("[AI Insight] Has selected text:", !!selectedText && selectedText.length > 0);
    console.log("[AI Insight] Has challenge:", !!effectiveSessionData?.challenge);
    console.log("[AI Insight] Has marketAnalysis:", !!effectiveSessionData?.marketAnalysis);
    console.log("[AI Insight] Has ideas:", !!effectiveSessionData?.ideas);
    console.log("[AI Insight] Selected idea ID:", effectiveSessionData?.selectedIdeaId);

    // Build rich context from phase - cumulative: includes all previous phases
    let contextInfo = `## Current Context:
- User is in: ${phaseContext?.phase || "unknown"} phase
${selectedText ? `- Selected text: "${selectedText}"` : `- Direct chat mode (no text selected)`}

---

## Phase Context (Cumulative - All Data Gathered So Far)
`;

    // ALWAYS include challenge context (available in all phases after challenge is complete)
    if (effectiveSessionData?.challenge) {
      contextInfo += `
### Challenge Phase
- Problem: ${effectiveSessionData.challenge.problem || "N/A"}
- Target Audience: ${effectiveSessionData.challenge.targetAudience || "N/A"}
- Current Solutions: ${effectiveSessionData.challenge.currentSolutions || "N/A"}
- Industry: ${effectiveSessionData.challenge.industry || "N/A"}
- Context: ${effectiveSessionData.challenge.context || "N/A"}`;
    }

    // Include market context if available (market phase or later)
    if (effectiveSessionData?.marketAnalysis) {
      const ma = effectiveSessionData.marketAnalysis;
      contextInfo += `

### Market Analysis Phase
- TAM: ${ma.tam || "N/A"}
- SAM: ${ma.sam || "N/A"}
- SOM: ${ma.som || "N/A"}
- Trends: ${JSON.stringify(ma.trends || [])}
- Competitors: ${JSON.stringify(ma.competitors || [])}
- Opportunities: ${JSON.stringify(ma.opportunities || [])}
- Challenges: ${JSON.stringify(ma.challenges || [])}`;
    }

    // Include ideation context if available (ideation phase or later)
    if (effectiveSessionData?.selectedIdeaId && effectiveSessionData?.ideas) {
      const selectedIdea = effectiveSessionData.ideas.find((i: any) => i.id === effectiveSessionData.selectedIdeaId);
      if (selectedIdea) {
        contextInfo += `

### Ideation Phase (Selected Idea)
- Name: ${selectedIdea.name || "N/A"}
- Tagline: ${selectedIdea.tagline || "N/A"}
- Description: ${selectedIdea.description || "N/A"}
- Problem Solved: ${selectedIdea.problemSolved || "N/A"}
- Target Market: ${selectedIdea.targetMarket || "N/A"}
- Business Model: ${selectedIdea.businessModel || "N/A"}
- Revenue Streams: ${JSON.stringify(selectedIdea.revenueStreams || [])}
- Competitive Advantage: ${selectedIdea.competitiveAdvantage || "N/A"}`;
      }
    }

    // Include appraisal context if available (appraisal phase or later)
    if (effectiveSessionData?.investmentAppraisal) {
      const appraisal = effectiveSessionData.investmentAppraisal;
      contextInfo += `

### Investment Appraisal Phase
- Target Market: ${appraisal.targetMarket || "N/A"}
- Business Model: ${appraisal.businessModel || "N/A"}
- Revenue Streams: ${JSON.stringify(appraisal.revenueStreams || [])}
- Cost Structure: ${JSON.stringify(appraisal.costStructure || [])}
- Key Metrics: ${JSON.stringify(appraisal.keyMetrics || {})}`;
    }

    // Include pitch context if available (pitch phase)
    if (effectiveSessionData?.pitchDeck) {
      const pitchDeck = effectiveSessionData.pitchDeck;
      contextInfo += `

### Pitch Phase
- Title: ${pitchDeck.title || "N/A"}
- Tagline: ${pitchDeck.tagline || "N/A"}
- Slides: ${pitchDeck.slides.length} slides generated`;
    }

    contextInfo += `

---`;

    // Log the final context for debugging
    console.log("[AI Insight] Built context length:", contextInfo.length);
    console.log("[AI Insight] Context preview:", contextInfo.slice(0, 500) + "...");

    // Debug event: Context built
    debugEvents.push({
      step: "context_built",
      timestamp: Date.now(),
      data: {
        phase: phaseContext?.phase,
        contextLength: contextInfo.length,
        hasChallenge: !!effectiveSessionData?.challenge,
        hasMarketAnalysis: !!effectiveSessionData?.marketAnalysis,
        hasIdeas: !!effectiveSessionData?.ideas,
        selectedIdeaId: effectiveSessionData?.selectedIdeaId
      }
    });

    // Perform web search if enabled - build comprehensive search query
    let webSearchResults: string | null = null;
    let searchQueryUsed = "";
    let rawSearchResults: Array<{
      refer: string;
      title: string;
      link: string;
      media: string;
      content: string;
      icon: string;
      publish_date: string;
    }> = [];
    if (useWebSearch) {
      try {
        // Check if this is a follow-up question or initial analysis
        const lastUserMessage = (messages || [])
          .filter((m: Message) => m.role === "user")
          .slice(-1)[0];

        const isFollowUp = messages && messages.length > 2;

        // PRE-THINKING: Use AI to determine optimal search query based on selected text and full context
        if (selectedText && selectedText.trim().length > 0) {
          console.log(`[AI Insight] Pre-thinking: Analyzing selected text "${selectedText}" with AI...`);

          // Build context summary for AI analysis
          const contextSummary = {
            phase: phaseContext?.phase || "unknown",
            challenge: effectiveSessionData?.challenge ? {
              industry: effectiveSessionData.challenge.industry,
              targetAudience: effectiveSessionData.challenge.targetAudience,
              problem: effectiveSessionData.challenge.problem
            } : null,
            market: effectiveSessionData?.marketAnalysis,
            selectedText: selectedText.trim()
          };

          // Use AI to generate optimal search query
          try {
            // Debug event: Starting query generation
            debugEvents.push({
              step: "query_generation_start",
              timestamp: Date.now(),
              data: {
                selectedText: selectedText.trim(),
                phase: contextSummary.phase,
                industry: contextSummary.challenge?.industry,
                audience: contextSummary.challenge?.targetAudience
              }
            });

            const queryPrompt = `Generate a search query for "${selectedText.trim()}" in the ${contextSummary.challenge?.industry || "retail"} industry for ${contextSummary.challenge?.targetAudience?.split(" ").slice(0, 5).join(" ") || "small business"}. Return ONLY the query.`;

            console.log(`[AI Insight] ========== QUERY GENERATION ==========`);
            console.log(`[AI Insight] Full prompt: "${queryPrompt}"`);
            console.log(`[AI Insight] Prompt length: ${queryPrompt.length}`);
            console.log(`[AI Insight] Model: ${config.openai.defaultModel}`);
            console.log(`[AI Insight] Base URL: ${config.openai.baseURL}`);
            console.log(`[AI Insight] Max tokens: 500`);

            // Create OpenAI client for query generation
            const openai = new OpenAI({
              apiKey: config.openai.apiKey,
              baseURL: config.openai.baseURL,
            });

            console.log(`[AI Insight] Sending request to AI...`);

            const queryResponse = await openai.chat.completions.create({
              model: config.openai.defaultModel,
              max_tokens: 1000,
              messages: [{
                role: "user",
                content: queryPrompt
              }]
            });

            console.log(`[AI Insight] Received response from AI`);
            console.log(`[AI Insight] Response choices: ${queryResponse.choices.length}`);
            console.log(`[AI Insight] First choice:`, JSON.stringify(queryResponse.choices[0], null, 2));

            // The glm-4.7 model puts content in reasoning_content field
            const message = queryResponse.choices[0]?.message;
            const aiRawResponse = (message?.content || message?.reasoning_content || "").trim();
            console.log(`[AI Insight] AI raw response: "${aiRawResponse}"`);
            console.log(`[AI Insight] AI raw response length: ${aiRawResponse.length}`);

            const aiGeneratedQuery = aiRawResponse || selectedText.trim();
            console.log(`[AI Insight] After trim (or fallback): "${aiGeneratedQuery}"`);

            searchQueryUsed = aiGeneratedQuery.slice(0, 70);
            console.log(`[AI Insight] Pre-thinking: AI generated query = "${searchQueryUsed}"`);

            // Debug event: Query generated
            debugEvents.push({
              step: "query_generated",
              timestamp: Date.now(),
              data: {
                query: searchQueryUsed,
                originalSelectedText: selectedText.trim(),
                aiRawResponse: aiRawResponse,
                method: "ai_generated"
              }
            });

          } catch (error) {
            console.error(`[AI Insight] AI query generation failed, using fallback:`, error);

            // Debug event: Query generation failed
            debugEvents.push({
              step: "query_generation_failed",
              timestamp: Date.now(),
              data: {
                error: error instanceof Error ? error.message : String(error),
                fallbackQuery: selectedText.trim().slice(0, 70)
              }
            });

            // Fallback to simple approach
            searchQueryUsed = selectedText.trim().slice(0, 70);
          }

        } else if (isFollowUp && lastUserMessage?.content) {
          // FOLLOW-UP MODE: Extract key concepts and combine with full context
          const questionWords = lastUserMessage.content
            .toLowerCase()
            .split(/\s+/)
            .filter((w: string) => w.length > 3)
            .filter((w: string) => !["what", "how", "why", "when", "where", "can", "could", "would", "should", "is", "are", "the", "a", "an", "for", "with", "about", "have", "been", "will", "think"].includes(w))
            .slice(0, 3);

          // Add comprehensive context for follow-ups
          if (effectiveSessionData?.challenge?.industry) {
            questionWords.push(effectiveSessionData.challenge.industry);
          }
          if (effectiveSessionData?.challenge?.targetAudience) {
            const audienceKeywords = effectiveSessionData.challenge.targetAudience.toLowerCase().match(/(?:small business|sme|retail|startup)/);
            if (audienceKeywords) {
              questionWords.push(audienceKeywords[0]);
            }
          }
          searchQueryUsed = questionWords.join(" ");
          console.log(`[AI Insight] Pre-thinking: Follow-up strategy = "${searchQueryUsed}"`);

        } else {
          // DIRECT CHAT FIRST MESSAGE: Use richest available business context
          if (effectiveSessionData?.challenge?.industry && effectiveSessionData?.challenge?.targetAudience) {
            searchQueryUsed = `${effectiveSessionData.challenge.industry} ${effectiveSessionData.challenge.targetAudience.split(" ").slice(0, 3).join(" ")} software market`;
          } else if (effectiveSessionData?.challenge?.problem) {
            searchQueryUsed = `${effectiveSessionData.challenge.problem.split(" ").slice(0, 4).join(" ")} market analysis`;
          } else {
            searchQueryUsed = "business innovation startup market analysis software";
          }
          console.log(`[AI Insight] Pre-thinking: Direct chat strategy = "${searchQueryUsed}"`);
        }

        searchQueryUsed = searchQueryUsed.slice(0, 70).trim();

        console.log("[AI Insight] Search query:", searchQueryUsed);

        // Debug event: Search starting
        debugEvents.push({
          step: "search_starting",
          timestamp: Date.now(),
          data: {
            query: searchQueryUsed,
            maxResults: 10,
            searchDepth: "basic"
          }
        });

        // Use Tavily API instead of MCP
        const results = await tavilySearch(searchQueryUsed, {
          max_results: 10,
          search_depth: "basic",
          topic: "general",
          days: 7,
        });

        console.log("[AI Insight] Tavily search returned", results.length, "results");

        // Debug event: Search completed
        debugEvents.push({
          step: "search_completed",
          timestamp: Date.now(),
          data: {
            query: searchQueryUsed,
            resultCount: results.length,
            sources: results.map(r => ({
              id: r.refer,
              title: r.title,
              source: r.media
            }))
          }
        });

        if (results.length > 0) {
          // Format search results for AI context
          webSearchResults = results.map((r) =>
            `[${r.refer}] ${r.title}\n   URL: ${r.link}\n   Source: ${r.media}\n   Summary: ${r.content.slice(0, 200)}...`
          ).join("\n\n");

          // Store raw results with full metadata for UI
          rawSearchResults = results;
        } else {
          console.log("[AI Insight] Tavily search returned no results");
        }
      } catch (error) {
        console.error("[AI Insight] Tavily search failed:", error);
        // Continue without web search on error
      }
    }

    // Build conversation history (excluding current message)
    const conversationHistory: Message[] = messages || [];

    // Build messages for API with preserved thinking
    // According to Z.AI docs, we must return reasoning_content in conversation history
    // to keep the reasoning coherent across turns
    const apiMessages: ClaudeMessageWithThinking[] = conversationHistory
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({
        role: m.role,
        content: m.content,
        // Include reasoning_content for assistant messages to preserve thinking
        ...(m.role === "assistant" && m.thinking && { reasoning_content: m.thinking })
      }));

    // Add system prompt with context
    const systemPrompt = `${TEXT_ANALYSIS_PROMPT}

${contextInfo}

${webSearchResults ? `
## 🔍 LIVE WEB SEARCH RESULTS - SYNTHESIZE WITH YOUR REASONING

Search Query: "${searchQueryUsed}"

CRITICAL INSTRUCTIONS:
1. **These are REAL, current web results** - not AI-generated
2. **Synthesize carefully**: Combine your analytical reasoning with these factual sources
3. **Cite everything**: Use [Source: ref_X] when referencing web data
4. **Cross-reference**: Use web data to validate, enhance, or challenge your reasoning
5. **Prioritize recent data**: Web sources may be more current than your training

${webSearchResults}

---

INTEGRATION STRATEGY:
- Use web search for: Current market data, recent trends, factual statistics, real-world examples
- Use your reasoning for: Analysis, insights, recommendations, connecting concepts
- ALWAYS distinguish between: Web-sourced facts vs. your analytical conclusions
- When sources conflict: Explain why and provide your assessment

` : ''}

## Instructions:
- This is a continuous conversation. Maintain context from previous messages.
- User can toggle web search ${useWebSearch ? "ON" : "OFF"}.
- Provide helpful, actionable insights.
- Show your thinking process transparently.
- ${useWebSearch ? "Synthesize web search results with your reasoning - cite sources explicitly." : "Use your knowledge and reasoning capabilities."}

If this is the first message, analyze the selected text.
If this is a follow-up, answer the user's question based on the conversation history.`;

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          const sendEvent = (data: unknown) => {
            const formatted = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(formatted));
          };

          // Send debug events first for transparency
          if (debugEvents.length > 0) {
            sendEvent({ type: "debug", data: debugEvents });
            console.log("[AI Insight] Sent", debugEvents.length, "debug events to client");
          }

          // Send search query first if web search was performed
          if (searchQueryUsed) {
            sendEvent({ type: "searchQuery", data: searchQueryUsed });
            console.log("[AI Insight] Sent search query:", searchQueryUsed);
          }

          // Send web search sources if available (use raw results with full metadata)
          if (rawSearchResults.length > 0) {
            sendEvent({ type: "sources", data: rawSearchResults });
            console.log("[AI Insight] Sent", rawSearchResults.length, "sources to client");
          }

          // Stream with thinking enabled
          for await (const chunk of streamClaudeWithThinking(apiMessages, systemPrompt, {
            thinking: true,
            webSearch: false, // We handle web search via MCP client
          })) {
            if (chunk.type === "thinking") {
              sendEvent({ type: "thinking", content: chunk.text });
            } else if (chunk.type === "content") {
              sendEvent({ type: "content", content: chunk.text });
            } else if (chunk.type === "sources") {
              // Forward any sources from the AI (for compatibility)
              sendEvent({ type: "sources", data: chunk.data });
            }
          }

          sendEvent({ type: "done" });
        } catch (error) {
          console.error("Streaming error:", error);
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Streaming failed",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
