import { NextRequest } from "next/server";
import { streamClaudeMessage, ClaudeMessage } from "@/lib/claude";
import { getSession } from "@/lib/session";
import type { PitchDeck, BusinessIdea, Challenge, MarketAnalysis } from "@/types/innovation";

const PITCH_ASSISTANT_PROMPT = `You are an expert pitch consultant and presentation coach helping users refine their investor pitch deck.

Your role is to:
- Answer questions about the pitch deck content and structure
- Provide suggestions for improving slide titles, content, and flow
- Offer presentation tips and talking points for each slide
- Help users refine their value proposition and key messages
- Suggest ways to make the pitch more compelling and investor-ready
- When user asks to update, change, or modify slides, you MUST output the complete updated pitch deck as JSON

When giving advice:
- Be specific and actionable
- Reference the actual slide content when relevant
- Consider the investor's perspective
- Focus on clarity, impact, and persuasion
- Keep responses concise but informative

IMPORTANT - Response Format:
- For general questions: Respond naturally with conversational text only
- For update/modification requests: Respond with conversational text FIRST, then include a JSON code block at the VERY END with this EXACT format:

\`\`\`json
{
  "PITCH_DECK_UPDATE": {
    "title": "Pitch Deck Title",
    "tagline": "Tagline here",
    "slides": [
      {
        "id": "slide-id",
        "type": "title|problem|solution|market|business-model|competition|traction|team|ask",
        "title": "Slide Title",
        "content": {
          "key1": "value or array of values"
        }
      }
    ]
  }
}
\`\`\`

CRITICAL RULES:
- ONLY include the JSON block when user explicitly asks to UPDATE, MODIFY, or CHANGE slides or the pitch deck
- Always return the COMPLETE updated pitch deck (not just the changed slide)
- The JSON block must be the LAST thing in your response - after all conversational text
- Do NOT include the JSON block for general questions or explanations
- Ensure all slide content values are either strings or arrays (no nested objects)

Keep responses concise but informative.`;

export async function POST(request: NextRequest) {
  const { userInput, conversationHistory, pitchDeck, challenge, marketAnalysis, selectedIdea } = await request.json();

  console.log("Pitch assistant API call:", { userInput, hasPitchDeck: !!pitchDeck, hasContext: !!(challenge || marketAnalysis || selectedIdea) });

  // Get session for context (fallback if not provided in request)
  const session = getSession();

  // Use provided context or fall back to session
  const currentChallenge = challenge || session?.challenge;
  const currentMarketAnalysis = marketAnalysis || session?.marketAnalysis;
  const currentIdea = selectedIdea || (session?.selectedIdeaId && session?.ideas?.find((i: any) => i.id === session.selectedIdeaId));

  // Build context from available data
  const context: string[] = [];

  if (currentChallenge) {
    context.push(`
Challenge Context:
- Problem: ${currentChallenge.problem}
- Target Audience: ${currentChallenge.targetAudience}
`);
  }

  if (currentMarketAnalysis) {
    context.push(`
Market Analysis:
- TAM: ${currentMarketAnalysis.tam}
- SAM: ${currentMarketAnalysis.sam}
- SOM: ${currentMarketAnalysis.som}
`);
  }

  if (currentIdea) {
    context.push(`
Selected Business Idea:
- Name: ${currentIdea.name}
- Tagline: ${currentIdea.tagline}
- Description: ${currentIdea.description}
- Business Model: ${currentIdea.businessModel}
`);
  }

  if (pitchDeck) {
    context.push(`
Current Pitch Deck:
- Title: ${pitchDeck.title}
- Tagline: ${pitchDeck.tagline}
- Slides: ${pitchDeck.slides.length}
${pitchDeck.slides.map((slide: any, i: number) => `
  ${i + 1}. ${slide.title} (${slide.type})`).join('')}
`);
  }

  // Build messages
  const messages: ClaudeMessage[] = [
    ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: `${context.join('\n\n')}

User: ${userInput}`,
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
        let hasPitchDeckUpdate = false;
        let lastStreamedPosition = 0;
        let inJsonBlock = false;

        for await (const chunk of streamClaudeMessage(messages, PITCH_ASSISTANT_PROMPT)) {
          fullResponse += chunk;
          hasPitchDeckUpdate = fullResponse.includes("PITCH_DECK_UPDATE");

          // Check if we need to hide any content (inside a JSON block with PITCH_DECK_UPDATE)
          const jsonResponseStart = fullResponse.indexOf("```json");
          const hasUpdateKeyword = hasPitchDeckUpdate;

          if (jsonResponseStart !== -1 && hasUpdateKeyword) {
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

        // Handle PITCH_DECK_UPDATE (for Q&A/modification flow)
        if (hasPitchDeckUpdate) {
          // Try to extract JSON from the response
          let jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
          let jsonStr = jsonMatch ? jsonMatch[1] : null;

          if (jsonStr) {
            try {
              const parsed = JSON.parse(jsonStr.trim());

              if (parsed.PITCH_DECK_UPDATE) {
                safeEnqueue(`data: ${JSON.stringify({ done: true, type: "update", data: parsed.PITCH_DECK_UPDATE })}\n\n`);
                controller.close();
                return;
              }
            } catch (e) {
              console.error("Failed to parse PITCH_DECK_UPDATE JSON:", e);
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
