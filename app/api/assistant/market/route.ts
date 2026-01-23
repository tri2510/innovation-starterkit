import { NextRequest } from "next/server";
import { streamClaudeMessage, ClaudeMessage } from "@/lib/claude";
import { getSession } from "@/lib/session";
import { MARKET_ANALYSIS_PROMPT } from "@/lib/prompts-clean";
import type { ChatMessage, MarketAnalysis } from "@/types/innovation";

const MARKET_ASSISTANT_PROMPT = `You are an expert market analyst and business consultant assisting users with their market analysis.

Your role is to:
- Answer questions about the market analysis data
- Help users modify and update their market analysis
- Update specific fields when requested (TAM, SAM, SOM, trends, competitors, opportunities, challenges)
- Provide insights on market trends, competitors, and opportunities
- Suggest ways to refine or expand their market research

IMPORTANT - Response Format:
- For general questions: Respond naturally with conversational text only
- For update/modification requests: Respond with conversational text FIRST, then include a JSON code block at the VERY END with this EXACT format:

\`\`\`json
{
  "MARKET_UPDATE": {
    "tam": "$X billion" | null,
    "sam": "$X billion" | null,
    "som": "$X million" | null,
    "trends": [{"name": "...", "description": "...", "momentum": "rising|stable|declining", "impact": "high|medium|low"}] | null,
    "competitors": [{"name": "...", "marketShare": "...", "strengths": ["..."], "weaknesses": ["..."]}] | null,
    "opportunities": ["..."] | null,
    "challenges": ["..."] | null
  }
}
\`\`\`

CRITICAL RULES:
- ONLY include the JSON block when user explicitly asks to UPDATE, MODIFY, or CHANGE the market analysis
- Set to null for fields that are not being changed
- The JSON block must be the LAST thing in your response - after all conversational text
- Do NOT include the JSON block for general questions or explanations

Be:
- Specific and data-driven
- Honest about risks and challenges
- Strategic in your guidance
- Helpful in exploring alternatives

Keep responses concise but informative.`;

export async function POST(request: NextRequest) {
  const { userInput, conversationHistory, marketAnalysis, challenge } = await request.json();

  console.log("Market assistant API call:", { userInput, hasMarketAnalysis: !!marketAnalysis, marketAnalysisKeys: marketAnalysis ? Object.keys(marketAnalysis) : [] });

  // Get session for context
  const session = getSession();
  console.log("Session data:", { hasChallenge: !!session?.challenge, hasSessionMarketAnalysis: !!session?.marketAnalysis });

  // Use provided challenge or fall back to session
  const currentChallenge = challenge || session?.challenge;

  // Use provided marketAnalysis or fall back to session
  const currentMarketAnalysis = marketAnalysis || session?.marketAnalysis;

  // If no market analysis exists, use interactive guidance flow
  const isInteractiveFlow = !currentMarketAnalysis;
  const systemPrompt = isInteractiveFlow ? MARKET_ANALYSIS_PROMPT : MARKET_ASSISTANT_PROMPT;

  // Build context from challenge (if available) and market analysis
  const challengeSection = currentChallenge ? `
Current Challenge:
- Problem: ${currentChallenge.problem}
- Target Audience: ${currentChallenge.targetAudience}
- Industry: ${currentChallenge.industry || "Not specified"}
` : "";

  let context = challengeSection.trim();

  // Only add market analysis context if it exists (for Q&A/modification flow)
  if (currentMarketAnalysis) {
    context += `

Market Analysis:
- TAM: ${currentMarketAnalysis.tam}
- SAM: ${currentMarketAnalysis.sam}
- SOM: ${currentMarketAnalysis.som}
- Trends: ${JSON.stringify(currentMarketAnalysis.trends)}
- Competitors: ${JSON.stringify(currentMarketAnalysis.competitors)}
- Opportunities: ${JSON.stringify(currentMarketAnalysis.opportunities)}
- Challenges: ${JSON.stringify(currentMarketAnalysis.challenges)}`;
  }

  context = context.trim();

  // Build messages
  const messages: ClaudeMessage[] = [
    ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: `${context}\n\nUser: ${userInput}`,
    },
  ];

  // Create a streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let controllerClosed = false;

      const safeEnqueue = (data: string) => {
        if (!controllerClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            controllerClosed = true;
          }
        }
      };

      try {
        let fullResponse = "";
        let hasMarketUpdate = false;
        let hasFinalAnalysis = false;
        let lastStreamedPosition = 0; // Track position of last streamed content
        let inJsonBlock = false; // Track if we're currently in a JSON block that should be hidden

        for await (const chunk of streamClaudeMessage(messages, systemPrompt)) {
          fullResponse += chunk;
          hasMarketUpdate = fullResponse.includes("MARKET_UPDATE");
          hasFinalAnalysis = fullResponse.includes("FINAL_MARKET_ANALYSIS");

          // Check if we need to hide any content (inside a JSON block with MARKET_UPDATE or FINAL_MARKET_ANALYSIS)
          const jsonResponseStart = fullResponse.indexOf("```json");
          const hasJsonKeyword = hasMarketUpdate || hasFinalAnalysis;

          if (jsonResponseStart !== -1 && hasJsonKeyword) {
            // We have a JSON block with update data
            const afterJsonStart = fullResponse.substring(jsonResponseStart);
            const jsonResponseEnd = afterJsonStart.indexOf("\n```");

            if (!inJsonBlock) {
              // First time detecting the JSON block - stream everything before it
              if (lastStreamedPosition < jsonResponseStart) {
                const contentToStream = fullResponse.substring(lastStreamedPosition, jsonResponseStart);
                if (contentToStream.trim()) {
                  safeEnqueue(`data: ${JSON.stringify({ chunk: contentToStream })}\n\n`);
                }
              }
              lastStreamedPosition = jsonResponseStart;
              inJsonBlock = true;
            }

            if (jsonResponseEnd !== -1) {
              // JSON block is complete - skip it and check for content after
              const endPosition = jsonResponseStart + jsonResponseEnd + 4; // +4 for "\n```"
              lastStreamedPosition = endPosition;

              // Check if there's content after the JSON block
              if (endPosition < fullResponse.length) {
                const afterJson = fullResponse.substring(endPosition);
                if (afterJson.trim()) {
                  safeEnqueue(`data: ${JSON.stringify({ chunk: afterJson })}\n\n`);
                }
                lastStreamedPosition = fullResponse.length;
              }

              inJsonBlock = false; // Reset the flag
            }
            // If JSON block is not complete yet, don't stream anything
          } else if (!inJsonBlock) {
            // No JSON block detected and not in a block - stream normally
            if (fullResponse.length > lastStreamedPosition) {
              const contentToStream = fullResponse.substring(lastStreamedPosition);
              if (contentToStream.trim()) {
                safeEnqueue(`data: ${JSON.stringify({ chunk: contentToStream })}\n\n`);
              }
              lastStreamedPosition = fullResponse.length;
            }
          }
        }

        // Handle FINAL_MARKET_ANALYSIS (for interactive flow)
        if (hasFinalAnalysis) {
          const finalMatch = fullResponse.match(/FINAL_MARKET_ANALYSIS[\s\S]*?\{[\s\S]*\}/);
          if (finalMatch) {
            try {
              const jsonMatch = finalMatch[0].match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const analysisData = JSON.parse(jsonMatch[0]);
                safeEnqueue(`data: ${JSON.stringify({ done: true, type: "analysis", data: analysisData })}\n\n`);
                controller.close();
                return;
              }
            } catch (e) {
              console.error("Failed to parse FINAL_MARKET_ANALYSIS:", e);
            }
          }
        }

        // Handle MARKET_UPDATE (for Q&A/modification flow)
        if (hasMarketUpdate && !hasFinalAnalysis) {
          // Try to extract JSON from the response
          let jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
          let jsonStr = jsonMatch ? jsonMatch[1] : null;

          if (jsonStr) {
            try {
              const parsed = JSON.parse(jsonStr.trim());

              if (parsed.MARKET_UPDATE) {
                safeEnqueue(`data: ${JSON.stringify({ done: true, type: "update", data: parsed.MARKET_UPDATE })}\n\n`);
                controller.close();
                return;
              }
            } catch (e) {
              console.error("Failed to parse MARKET_UPDATE JSON:", e);
            }
          }
        }

        // If no valid update, send as text response
        safeEnqueue(`data: ${JSON.stringify({ done: true, type: "text", data: fullResponse.trim() })}\n\n`);

        if (!controllerClosed) {
          controller.close();
          controllerClosed = true;
        }
      } catch (error) {
        console.error("Stream error:", error);
        safeEnqueue(`data: ${JSON.stringify({ done: true, type: "error", data: "Failed to process request" })}\n\n`);
        if (!controllerClosed) {
          controller.error(error);
          controllerClosed = true;
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
