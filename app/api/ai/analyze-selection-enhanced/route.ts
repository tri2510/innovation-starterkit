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
            const queryPrompt = `You are a search query optimization expert. Analyze the selected text and business context to generate the MOST EFFECTIVE web search query.

SELECTED TEXT: "${selectedText.trim()}"

BUSINESS CONTEXT:
- Phase: ${contextSummary.phase}
- Industry: ${contextSummary.challenge?.industry || "N/A"}
- Target Audience: ${contextSummary.challenge?.targetAudience || "N/A"}
- Problem Domain: ${contextSummary.challenge?.problem?.substring(0, 100) || "N/A"}

YOUR TASK:
1. Understand what the user is really looking for
2. Expand acronyms if they refer to business concepts (TAM → Total Addressable Market, etc.)
3. Add relevant business context to avoid brand collisions
4. Create a search query that will return the most useful results
5. Keep query under 70 characters

CRITICAL RULES:
- If "TAM" refers to market sizing, use "Total Addressable Market" 
- If "SAM" refers to market sizing, use "Serviceable Addressable Market"
- Add business context (industry, audience) to avoid wrong results
- Prioritize recent business relevance over general definitions
- Avoid competitor brand names in the query

Respond ONLY with the optimized search query (no explanation).`;

            // Create OpenAI client for query generation
            const openai = new OpenAI({
              apiKey: config.openai.apiKey,
              baseURL: config.openai.baseURL,
            });

            const queryResponse = await openai.chat.completions.create({
              model: config.openai.defaultModel,
              max_tokens: 100,
              messages: [{
                role: "user",
                content: queryPrompt
              }]
            });

            const aiGeneratedQuery = queryResponse.choices[0]?.message?.content?.trim() || selectedText.trim();

            searchQueryUsed = aiGeneratedQuery.slice(0, 70);
            console.log(`[AI Insight] Pre-thinking: AI generated query = "${searchQueryUsed}"`);

          } catch (error) {
            console.error(`[AI Insight] AI query generation failed, using fallback:`, error);
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

        // Use Tavily API instead of MCP
        const results = await tavilySearch(searchQueryUsed, {
          max_results: 10,
          search_depth: "basic",
          topic: "general",
          days: 7,
        });

        console.log("[AI Insight] Tavily search returned", results.length, "results");

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
