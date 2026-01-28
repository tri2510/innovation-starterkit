import Anthropic from "@anthropic-ai/sdk";
import { config } from './config';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
  baseURL: config.anthropic.baseURL,
});

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Send a message to Claude with structured JSON output expectation
 */
export async function sendClaudeMessage<T = unknown>(
  messages: ClaudeMessage[],
  systemPrompt: string,
  maxTokens: number = 4096
): Promise<ClaudeResponse<T>> {
  try {
    if (!config.anthropic.apiKey) {
      return {
        success: false,
        error: "ANTHROPIC_API_KEY is not configured",
      };
    }

    const response = await anthropic.messages.create({
      model: config.anthropic.defaultModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages,
    });

    // Extract text content from response
    const content = response.content[0];
    if (content.type === "text") {
      // Strip markdown code blocks if present
      let textToParse = content.text.trim();

      // Try to extract JSON from code blocks
      const codeBlockMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        textToParse = codeBlockMatch[1].trim();
      } else {
        // Try to find a JSON object/array in the text (in case model wraps JSON in text)
        const jsonMatch = textToParse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          textToParse = jsonMatch[0].trim();
        }
      }

      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(textToParse);
        return { success: true, data: jsonData as T };
      } catch (parseError) {
        // JSON parsing failed - log and return error
        console.error("Failed to parse JSON from response:", parseError);
        console.error("Response text:", content.text.slice(0, 500));
        console.error("Extracted text:", textToParse.slice(0, 500));
        return {
          success: false,
          error: "Failed to parse response as JSON. The AI returned text instead of valid JSON.",
        };
      }
    }

    return {
      success: false,
      error: "Unexpected response format from Claude",
    };
  } catch (error) {
    console.error("Claude API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Stream a response from Claude (for chat interfaces)
 */
export async function* streamClaudeMessage(
  messages: ClaudeMessage[],
  systemPrompt: string
): AsyncGenerator<string, void, unknown> {
  if (!config.anthropic.apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  console.log("[streamClaudeMessage] Starting stream with max_tokens: 8192");

  const stream = await anthropic.messages.create({
    model: config.anthropic.defaultModel,
    max_tokens: 8192, // Increased from 4096 to prevent cutoff
    system: systemPrompt,
    messages: messages,
    stream: true,
  });

  let eventCount = 0;
  let totalContentLength = 0;

  for await (const event of stream) {
    eventCount++;

    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      const text = event.delta.text;
      totalContentLength += text.length;
      yield text;
    }

    // Log every 100 events to avoid spam
    if (eventCount % 100 === 0) {
      console.log(`[streamClaudeMessage] Processed ${eventCount} events, ${totalContentLength} chars`);
    }
  }

  console.log(`[streamClaudeMessage] Stream complete. Total events: ${eventCount}, Total chars: ${totalContentLength}`);
}

/**
 * Extended message interface for Z.AI thinking mode
 */
export interface ClaudeMessageWithThinking extends ClaudeMessage {
  reasoning_content?: string;
}

/**
 * Raw event type from Anthropic SDK - includes all possible fields
 */
interface StreamEvent {
  type: string;
  index?: number;
  content_block?: { type?: string; index?: number };
  delta?: {
    type?: string;
    text?: string;
    // Z.AI specific fields that might come through
    reasoning_content?: string;
    content?: string;
    thinking?: string; // Z.AI thinking_delta format
  };
  message?: {
    id?: string;
    type?: string;
    role?: string;
    content?: Array<{ type?: string; text?: string }>;
    reasoning_content?: string;
    model?: string;
    stop_reason?: string;
    stop_sequence?: number | null;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
    // Z.AI specific fields
    web_search?: unknown[];
  };
  // Z.AI top-level web_search results (not in message)
  web_search?: unknown[];
  raw?: unknown;
  [key: string]: unknown;
}

/**
 * Stream a response from Claude with thinking mode enabled
 * Returns both thinking process and final content
 *
 * Z.AI (GLM-4.7) thinking mode implementation:
 * - GLM-4.7 has thinking enabled by default
 * - Response includes reasoning_content field
 * - We parse the stream to extract both thinking and content
 */
export async function* streamClaudeWithThinking(
  messages: ClaudeMessage[],
  systemPrompt: string,
  options?: { thinking?: boolean; webSearch?: boolean }
): AsyncGenerator<
  { type: "thinking"; text: string } | { type: "content"; text: string } | { type: "sources"; data: unknown[] },
  void,
  unknown
> {
  if (!config.anthropic.apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  console.log("[streamClaudeWithThinking] Starting stream with thinking:", options?.thinking !== false, "webSearch:", options?.webSearch);

  // Build base request parameters
  const requestParams: Record<string, unknown> = {
    model: config.anthropic.defaultModel,
    max_tokens: 8192, // Increased from 4096 to prevent cutoff
    system: systemPrompt,
    messages: messages,
    stream: true,
  };

  // Add thinking mode if enabled - Z.AI/GLM-4.7 specific
  if (options?.thinking !== false) {
    requestParams.thinking = {
      type: "enabled"
    };
  }

  // Add web search if enabled - Z.AI specific
  // Use tools parameter format - Z.AI requires 'name' field
  if (options?.webSearch) {
    requestParams.tools = [
      {
        type: "web_search",
        name: "web_search",
        web_search: {
          search_mode: "auto"
        }
      }
    ];
    console.log("[streamClaudeWithThinking] Web search enabled via tools parameter with name");
  }

  console.log("[streamClaudeWithThinking] Request params keys:", Object.keys(requestParams));
  console.log("[streamClaudeWithThinking] Using max_tokens: 8192");
  const stream = await anthropic.messages.create(requestParams as any) as unknown as AsyncIterable<unknown>;

  let eventCount = 0;
  let hasThinkingContent = false;
  let totalThinkingLength = 0;
  let totalContentLength = 0;

  for await (const event of stream) {
    eventCount++;
    const evt = event as StreamEvent;

    // Log first few events to understand the structure
    if (eventCount <= 3) {
      console.log(`[stream event ${eventCount}] type:`, evt.type, "keys:", Object.keys(evt));
      if (evt.delta) {
        console.log(`[stream event ${eventCount}] delta:`, evt.delta);
      }
      if (evt.message) {
        console.log(`[stream event ${eventCount}] message keys:`, Object.keys(evt.message));
      }
    }

    // Log every 100 events to track progress
    if (eventCount % 100 === 0) {
      console.log(`[streamClaudeWithThinking] Processed ${eventCount} events, thinking: ${totalThinkingLength} chars, content: ${totalContentLength} chars`);
    }

    // Extract thinking content from various possible locations
    let thinkingText: string | null = null;
    let contentText: string | null = null;

    // Method 1: Z.AI thinking_delta format with 'thinking' field
    if (evt.delta?.type === 'thinking_delta' && evt.delta?.thinking) {
      thinkingText = evt.delta.thinking;
    }

    // Method 2: Check delta.reasoning_content (alternative Z.AI format)
    if (evt.delta?.reasoning_content) {
      thinkingText = evt.delta.reasoning_content;
    }

    // Method 3: Check delta.content (could be content from text_delta)
    if (evt.delta?.content) {
      contentText = evt.delta.content;
    }

    // Method 4: Standard Anthropic format - content_block_delta with text_delta
    if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" && evt.delta?.text) {
      contentText = evt.delta.text;
    }

    // Method 5: Check message.reasoning_content (might appear in message_stop event)
    if (evt.message?.reasoning_content) {
      // This is the complete reasoning content at the end
      thinkingText = evt.message.reasoning_content;
    }

    // Method 6: Check for web_search results at top level (Z.AI format)
    if (evt.web_search && Array.isArray(evt.web_search) && evt.web_search.length > 0) {
      console.log("[stream] Found web search results at top level:", evt.web_search.length);
      yield { type: "sources", data: evt.web_search };
    }
    // Also check nested in message (alternative format)
    if (evt.message?.web_search && Array.isArray(evt.message.web_search) && evt.message.web_search.length > 0) {
      console.log("[stream] Found web search results in message:", evt.message.web_search.length);
      yield { type: "sources", data: evt.message.web_search };
    }

    // Yield thinking content
    if (thinkingText) {
      hasThinkingContent = true;
      totalThinkingLength += thinkingText.length;
      console.log("[stream] Yielding thinking:", thinkingText.slice(0, 50) + "...");
      yield { type: "thinking", text: thinkingText };
    }

    // Yield content
    if (contentText) {
      totalContentLength += contentText.length;
      console.log("[stream] Yielding content:", contentText.slice(0, 50) + "...");
      yield { type: "content", text: contentText };
    }

    // Check for message_stop event to detect completion
    if (evt.type === 'message_stop') {
      console.log("[streamClaudeWithThinking] Received message_stop event - stream complete");
    }

    // Check for stop_reason to detect if response was truncated
    if (evt.message?.stop_reason) {
      const stopReason = evt.message.stop_reason;
      console.log("[streamClaudeWithThinking] Stop reason:", stopReason);

      if (stopReason === 'max_tokens') {
        console.warn("[streamClaudeWithThinking] WARNING: Response was truncated due to max_tokens limit!");
        console.warn("[streamClaudeWithThinking] Current content length:", totalContentLength, "chars");
        console.warn("[streamClaudeWithThinking] Consider increasing max_tokens further if responses are consistently cut off");
      }
    }
  }

  console.log("[streamClaudeWithThinking] Stream complete. Total events:", eventCount);
  console.log("[streamClaudeWithThinking] Final content length:", totalContentLength, "chars");
  console.log("[streamClaudeWithThinking] Final thinking length:", totalThinkingLength, "chars");
  console.log("[streamClaudeWithThinking] Had thinking content:", hasThinkingContent);
}

export { anthropic };
