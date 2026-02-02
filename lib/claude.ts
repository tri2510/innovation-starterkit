import OpenAI from 'openai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import { config } from './config';

// Initialize OpenAI client (Z.AI OpenAI-compatible endpoint)
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: config.openai.baseURL,
});

// Export the OpenAI client for legacy code that imported 'anthropic'
export const anthropic = openai;

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
 * Extended message interface for Z.AI thinking mode
 */
export interface ClaudeMessageWithThinking extends ClaudeMessage {
  reasoning_content?: string;
}

/**
 * Send a message (non-streaming) - compatibility wrapper
 */
export async function sendClaudeMessage<T = unknown>(
  messages: ClaudeMessage[],
  systemPrompt: string,
  maxTokens: number = 4096
): Promise<ClaudeResponse<T>> {
  try {
    if (!config.openai.apiKey) {
      return {
        success: false,
        error: "OPENAI_API_KEY is not configured",
      };
    }

    const openaiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: config.openai.defaultModel,
      max_tokens: maxTokens,
      messages: openaiMessages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: "No content in response",
      };
    }

    // Strip markdown code blocks if present
    let textToParse = content.trim();

    // Try to extract JSON from code blocks
    const codeBlockMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      textToParse = codeBlockMatch[1].trim();
    } else {
      // Try to find a JSON object/array in the text
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
      console.error("Failed to parse JSON from response:", parseError);
      console.error("Response text:", content.slice(0, 500));
      console.error("Extracted text:", textToParse.slice(0, 500));
      return {
        success: false,
        error: "Failed to parse response as JSON. The AI returned text instead of valid JSON.",
      };
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Stream a message - compatibility wrapper
 */
export async function* streamClaudeMessage(
  messages: ClaudeMessage[],
  systemPrompt: string
): AsyncGenerator<string, void, unknown> {
  if (!config.openai.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openaiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  ];

  const stream = await openai.chat.completions.create({
    model: config.openai.defaultModel,
    max_tokens: 4096,
    messages: openaiMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      yield delta.content;
    }
  }
}

/**
 * Stream a message with thinking mode enabled - compatibility wrapper
 * Returns both thinking process and final content
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
  if (!config.openai.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  console.log("[streamClaudeWithThinking] Starting stream");

  const stream = await openai.chat.completions.create({
    model: config.openai.defaultModel,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ],
    stream: true,
  }) as AsyncIterable<ChatCompletionChunk>;

  let eventCount = 0;

  for await (const chunk of stream) {
    eventCount++;
    const delta = chunk.choices[0]?.delta;

    // Log first few events
    if (eventCount <= 3) {
      console.log(`[stream event ${eventCount}] delta:`, delta);
    }

    // Regular content
    if (delta?.content) {
      console.log("[stream] Yielding content:", delta.content.slice(0, 50) + "...");
      yield { type: "content", text: delta.content };
    }
  }

  console.log("[stream] Complete. Total events:", eventCount);
}
