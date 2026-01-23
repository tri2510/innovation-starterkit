import { NextRequest } from "next/server";
import { streamClaudeMessage, ClaudeMessage } from "@/lib/claude";
import { PITCH_DECK_PROMPT, buildPitchContext } from "@/lib/prompts-clean";
import type { Challenge, MarketAnalysis, BusinessIdea, PitchDeck } from "@/types/innovation";

export async function POST(request: NextRequest) {
  const { challenge, marketAnalysis, selectedIdea } = await request.json();

  if (!challenge || !selectedIdea) {
    return new Response(
      JSON.stringify({ success: false, error: "Challenge and selected idea are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const context = buildPitchContext(
    challenge as Challenge,
    marketAnalysis as MarketAnalysis | undefined,
    selectedIdea as BusinessIdea
  );

  const messages: ClaudeMessage[] = [
    {
      role: "user",
      content: `Generate a compelling investor pitch deck:\n\n${context}`,
    },
  ];

  // Create streaming response
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
        let lastStreamedPosition = 0;

        for await (const chunk of streamClaudeMessage(messages, PITCH_DECK_PROMPT)) {
          fullResponse += chunk;

          // Filter out JSON code blocks from streaming for cleaner chat UI
          // Find all JSON code blocks and exclude them from streaming
          const jsonStartIndex = fullResponse.indexOf("```json");

          if (jsonStartIndex !== -1) {
            // We have a JSON code block - stream only content before it
            if (lastStreamedPosition < jsonStartIndex) {
              const contentToStream = fullResponse.substring(lastStreamedPosition, jsonStartIndex);
              if (contentToStream.trim()) {
                safeEnqueue(`data: ${JSON.stringify({ chunk: contentToStream })}\n\n`);
              }
            }
            lastStreamedPosition = jsonStartIndex;
          } else if (fullResponse.length > lastStreamedPosition) {
            // No JSON block yet, stream all content
            const contentToStream = fullResponse.substring(lastStreamedPosition);
            if (contentToStream.trim()) {
              safeEnqueue(`data: ${JSON.stringify({ chunk: contentToStream })}\n\n`);
            }
            lastStreamedPosition = fullResponse.length;
          }
        }

        // At the end, try to extract pitch deck from any JSON code block
        let jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        let jsonStr = jsonMatch ? jsonMatch[1] : null;

        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr.trim());

            // Handle both formats: {PITCH_DECK: {...}} and direct {...}
            const pitchDeckData = parsed.PITCH_DECK || parsed;

            // Validate it's a pitch deck structure (has slides array and title)
            if (pitchDeckData && pitchDeckData.slides && Array.isArray(pitchDeckData.slides) && pitchDeckData.title) {
              console.log("Successfully parsed pitch deck:", pitchDeckData.title, "with", pitchDeckData.slides.length, "slides");
              safeEnqueue(`data: ${JSON.stringify({ done: true, type: "pitch_deck", data: pitchDeckData })}\n\n`);
              controller.close();
              return;
            }
          } catch (e) {
            console.error("Failed to parse PITCH_DECK JSON:", e);
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
