import { NextRequest } from "next/server";
import { streamChatResponseWithProgress } from "@/lib/ai-streaming";
import { MARKET_ANALYSIS_PROMPT } from "@/lib/prompts-clean";

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userInput, conversationHistory, editSection, currentMarketAnalysis, challenge } = await request.json();

    // Validate input
    if (!userInput || !userInput.trim()) {
      return new Response(
        JSON.stringify({ error: "User input is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build conversation messages for AI SDK
    const messages = [
      ...(conversationHistory || [])
        .filter((msg: { role: string; content: string }) => msg.content && msg.content.trim())
        .map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })),
      {
        role: "user",
        content: userInput,
      },
    ];

    // Build system prompt with challenge context
    let systemPrompt = MARKET_ANALYSIS_PROMPT;

    // Add challenge context if provided
    if (challenge) {
      const challengeContext = `
## Challenge Context (from previous phase)
- **Problem**: ${challenge.problem}
- **Target Audience**: ${challenge.targetAudience}
- **Existing Solutions**: ${challenge.currentSolutions}
${challenge.industry ? `- **Industry**: ${challenge.industry}` : ""}
${challenge.context ? `- **Additional Context**: ${challenge.context}` : ""}

IMPORTANT: Reference this challenge context when conducting market analysis. The market size, trends, competitors, and opportunities should all be analyzed in the context of this specific challenge and target audience.
`;
      systemPrompt = challengeContext + "\n\n" + systemPrompt;
    }
    if (editSection && currentMarketAnalysis) {
      systemPrompt = `EDIT MODE ACTIVE - User wants to update the "${editSection}" section.

${MARKET_ANALYSIS_PROMPT}

## Current Market Analysis (keep other sections unchanged, only modify ${editSection}):
${JSON.stringify(currentMarketAnalysis, null, 2)}

**EDIT MODE RULES:**
1. Update ONLY the "${editSection}" section based on user's request
2. Keep ALL other sections exactly as they are above
3. Output FINAL_SUMMARY with ALL sections (updated + unchanged)
4. NO confirmation questions - process the change immediately
5. Be concise in your response, then output the JSON`;
    }

    // Create a streaming response using AI SDK
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
          // Use the streaming function with progress tracking
          await streamChatResponseWithProgress(
            messages,
            systemPrompt,
            {
              onProgress: (text: string) => {
                // Stream individual text chunks
                safeEnqueue(`data: ${JSON.stringify({ chunk: text })}\n\n`);
              },
              onProgressUpdate: (update) => {
                // Send progress updates to UI in the expected format
                safeEnqueue(`data: ${JSON.stringify({
                  type: "progress_update",
                  data: update
                })}\n\n`);
              },
              onComplete: (data) => {
                // Send final completion message
                safeEnqueue(`data: ${JSON.stringify({ done: true, ...data })}\n\n`);
              },
              onError: (error) => {
                console.error("Market AI streaming error:", error);
                safeEnqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`);
              }
            }
          );

          if (!controllerClosed) {
            controller.close();
            controllerClosed = true;
          }
        } catch (error) {
          console.error("Market streaming error:", error);
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
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Market API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
