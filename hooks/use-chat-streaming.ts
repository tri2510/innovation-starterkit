import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@/types/innovation";
import { FakeStreamer, shouldUseFakeStream, adaptiveDelay } from "@/lib/fake-stream";

export interface StreamChunk {
  chunk?: string;
  done?: boolean;
  type?: string;
  data?: any;
}

export interface ProgressUpdateChunk {
  type: "progress_update";
  data: {
    field: string;
    status: "gathering" | "pending_confirmation" | "complete";
    excerpt: string;
  };
}

export interface MarketProgressUpdateChunk {
  type: "progress_update";
  data: {
    section: string;
    status: "gathering" | "awaiting_confirmation" | "complete";
    excerpt: string;
    partialData?: {
      tam?: string | null;
      sam?: string | null;
      som?: string | null;
      trends?: Array<{ name: string; description: string; momentum?: string; impact?: string }>;
      competitors?: Array<{ name: string; strengths?: string | null; weaknesses?: string | null; marketShare?: string | null }>;
      opportunities?: string[];
      challenges?: string[];
    };
  };
}

export interface StreamingCallbacks {
  onChunk?: (chunk: string, displayContent: string, fullResponse: string, data: StreamChunk) => void;
  onProgressUpdate?: (update: ProgressUpdateChunk | MarketProgressUpdateChunk) => void;
  onComplete?: (data: StreamChunk, fullResponse: string) => void;
  onError?: (errorMessage: string) => void;
  filterDisplayContent?: (content: string) => string;
  timeout?: number; // Timeout in milliseconds (default: 120000ms = 2 minutes)
  /** Enable fake streaming for smoother filtered output (default: true) */
  enableFakeStream?: boolean;
}

export interface SendMessageOptions {
  apiEndpoint: string;
  requestBody: Record<string, any>;
  callbacks: StreamingCallbacks;
}

/**
 * Core streaming function - handles SSE parsing and calls callbacks
 * This is the reusable streaming logic extracted from challenge phase
 */
export async function streamChatResponse(
  apiEndpoint: string,
  requestBody: Record<string, any>,
  callbacks: StreamingCallbacks
): Promise<string> {
  const { onChunk, onProgressUpdate, onComplete, onError, filterDisplayContent, timeout, enableFakeStream = true } = callbacks;
  const timeoutMs = timeout ?? 120000; // Default 2 minute timeout

  // Create AbortController for timeout
  const abortController = new AbortController();

  // Set timeout to abort the request
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  // Fake streamer for smooth output
  const fakeStreamer = new FakeStreamer({
    charsPerChunk: 3,
    delayMs: adaptiveDelay(500), // Will adjust based on actual content length
  });

  let sourceChunkCount = 0;
  let lastDisplayedLength = 0;

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`API error ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body");
    }

    let buffer = "";
    let fullResponse = "";

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split by double newline to get complete SSE messages
      const msgs = buffer.split("\n\n");
      buffer = msgs.pop() || ""; // Keep incomplete message in buffer

      for (const msg of msgs) {
        if (!msg.trim()) continue;
        if (!msg.startsWith("data: ")) continue;

        try {
          const jsonStr = msg.slice(5).trim(); // Remove "data: " prefix
          const data: StreamChunk = JSON.parse(jsonStr);

          // Handle progress updates (new format)
          if (data.type === "progress_update" && onProgressUpdate) {
            onProgressUpdate(data as ProgressUpdateChunk);
            continue;
          }

          if (data.chunk) {
            // Streaming chunk - accumulate response
            fullResponse += data.chunk;
            sourceChunkCount++;

            // Get filtered display content
            const displayContent = filterDisplayContent
              ? filterDisplayContent(fullResponse)
              : fullResponse;

            if (onChunk) {
              if (enableFakeStream && filterDisplayContent) {
                // Use fake streaming for smoother output (throttled mode by default)
                const newContent = displayContent.slice(lastDisplayedLength);

                // FakeStreamer in throttleUpdates mode returns batched content
                for await (const fakeChunk of fakeStreamer.add(newContent)) {
                  onChunk(fakeChunk, displayContent, fullResponse, data);
                  lastDisplayedLength += fakeChunk.length;
                }
              } else {
                // Direct streaming (no fake stream)
                onChunk(data.chunk, displayContent, fullResponse, data);
                lastDisplayedLength = displayContent.length;
              }
            }
          } else if (data.done) {
            // Stream complete - flush any remaining content
            if (onComplete) {
              const finalContent = filterDisplayContent
                ? filterDisplayContent(fullResponse)
                : fullResponse;

              // Flush remaining fake-streamed content
              if (enableFakeStream && filterDisplayContent) {
                const remaining = finalContent.slice(lastDisplayedLength);
                if (remaining) {
                  for await (const fakeChunk of fakeStreamer.add(remaining)) {
                    lastDisplayedLength += fakeChunk.length;
                  }
                }
              }

              onComplete(data, finalContent);
            }
          }
        } catch (e) {
          console.error("Failed to parse SSE message:", e, msg);
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("Error in streaming:", error);

    // Check if it's an abort error (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutMessage = "The response is taking too long. Please try again or rephrase your message.";
      if (onError) {
        onError(timeoutMessage);
      }
      throw new Error(timeoutMessage);
    }

    // Detect specific error types for better user feedback
    let errorMessage = "Sorry, I encountered an error. Please try again.";

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // Check for credit/rate limit issues
      if (errorMsg.includes('credit') || errorMsg.includes('rate limit') || errorMsg.includes('quota') ||
          errorMsg.includes('insufficient') || errorMsg.includes('402') || errorMsg.includes('429')) {
        errorMessage = "API credit limit reached. Please check your API key or add credits to continue.";
      }
      // Check for API key issues
      else if (errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('401') || errorMsg.includes('authentication')) {
        errorMessage = "API key is invalid or missing. Please check your configuration.";
      }
      // Check for network issues
      else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection') || errorMsg.includes('econnrefused')) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
      // Check for server errors
      else if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503') || errorMsg.includes('504')) {
        errorMessage = "Server error. The service is temporarily unavailable. Please try again later.";
      }
    }

    if (onError) {
      onError(errorMessage);
    }

    throw error;
  } finally {
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}

/**
 * React hook for chat streaming
 * Manages loading state and provides a sendMessage function
 */
export function useChatStreaming() {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    userMessage: ChatMessage,
    options: SendMessageOptions
  ): Promise<string> => {
    if (isLoading) return "";

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);

    // Create placeholder message ID for streaming
    const aiMessageId = "ai-" + Date.now();

    try {
      await streamChatResponse(options.apiEndpoint, options.requestBody, options.callbacks);
      return aiMessageId;
    } catch (error) {
      // Error already handled in streamChatResponse
      return aiMessageId;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Cleanup on unmount
  useState(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  });

  return {
    sendMessage,
    isLoading,
  };
}
