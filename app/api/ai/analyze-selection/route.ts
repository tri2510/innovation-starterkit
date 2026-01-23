import { NextRequest } from "next/server";
import { anthropic, streamClaudeWithThinking } from "@/lib/claude";
import { TEXT_ANALYSIS_PROMPT } from "@/lib/prompts-clean";

export async function POST(request: NextRequest) {
  try {
    const { selectedText, context } = await request.json();

    if (!selectedText || typeof selectedText !== "string") {
      return new Response(JSON.stringify({ error: "Invalid selected text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `${TEXT_ANALYSIS_PROMPT}

## Current Context:
- User is in: ${context?.phase || "unknown"} phase

Adjust your analysis based on this context.

The user has selected the following text from the page:
"""
${selectedText}
"""

Provide your analysis of this text selection.`;

    const messages = [
      {
        role: "user" as const,
        content: `Please analyze this text selection from the innovation document:\n\n"${selectedText}"`,
      },
    ];

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          const sendEvent = (data: unknown) => {
            const formatted = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(formatted));
          };

          for await (const chunk of streamClaudeWithThinking(messages, systemPrompt, {
            thinking: true,
          })) {
            if (chunk.type === "thinking") {
              sendEvent({ type: "thinking", content: chunk.text });
            } else if (chunk.type === "content") {
              sendEvent({ type: "content", content: chunk.text });
            } else if (chunk.type === "sources") {
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
