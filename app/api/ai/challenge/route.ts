import { NextRequest } from "next/server";
import { streamChatResponseWithProgress } from "@/lib/ai-streaming";
import { CHALLENGE_GUIDANCE_PROMPT } from "@/lib/prompts-clean";

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userInput, conversationHistory } = await request.json();

    // Build conversation messages for new AI SDK
    const messages = [
      ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: userInput,
      },
    ];

    // Create a streaming response using new AI SDK
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
          // Use the new AI SDK streaming function with progress tracking
          await streamChatResponseWithProgress(
            messages,
            CHALLENGE_GUIDANCE_PROMPT,
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
                console.error("AI streaming error:", error);
                safeEnqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`);
              }
            }
          );

          if (!controllerClosed) {
            controller.close();
            controllerClosed = true;
          }
        } catch (error) {
          console.error("Streaming error:", error);
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
    console.error("Challenge API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}