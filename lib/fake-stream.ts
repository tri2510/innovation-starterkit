/**
 * Fake Streaming Utility
 *
 * Creates smooth typewriter-like output for filtered content
 * to avoid jumps when JSON blocks are removed from the stream.
 */

export interface FakeStreamOptions {
  /** Characters per chunk (default: 2-3 for natural feel) */
  charsPerChunk?: number;
  /** Delay between chunks in ms (default: 8ms for smooth typing) */
  delayMs?: number;
  /** Whether to use word-based streaming instead of character-based */
  wordBased?: boolean;
  /** Throttle state updates to avoid React max depth errors (default: true) */
  throttleUpdates?: boolean;
}

/**
 * Stream text with fake typewriter effect
 * Useful when content is filtered and appears abruptly
 */
export async function* fakeStream(
  text: string,
  options: FakeStreamOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    charsPerChunk = 3,
    delayMs = 8,
    wordBased = false,
  } = options;

  if (wordBased) {
    // Word-based streaming (faster, good for longer content)
    const words = text.split(/(\s+)/); // Keep whitespace
    for (const word of words) {
      yield word;
      await sleep(delayMs);
    }
  } else {
    // Character-based streaming (smoother typewriter effect)
    for (let i = 0; i < text.length; i += charsPerChunk) {
      const chunk = text.slice(i, i + charsPerChunk);
      yield chunk;
      await sleep(delayMs);
    }
  }
}

/**
 * Create a fake streaming effect that accumulates content
 * and streams it smoothly, even when source chunks arrive irregularly
 */
export class FakeStreamer {
  private buffer = "";
  private lastYieldedLength = 0;
  private readonly charsPerChunk: number;
  private readonly delayMs: number;
  private readonly throttleUpdates: boolean;

  constructor(options: FakeStreamOptions = {}) {
    this.charsPerChunk = options.charsPerChunk ?? 3;
    this.delayMs = options.delayMs ?? 8;
    this.throttleUpdates = options.throttleUpdates ?? true;
  }

  /**
   * Add new content to the buffer and return chunks to stream
   * Returns all chunks at once (batched) to avoid state update loops
   */
  async *add(content: string): AsyncGenerator<string, void, unknown> {
    if (!content) return;

    this.buffer += content;
    const newContent = this.buffer.slice(this.lastYieldedLength);

    if (this.throttleUpdates) {
      // Batch mode: return all content as one chunk to avoid state update loops
      // The fake streaming effect is handled by spreading updates across multiple SSE messages
      if (newContent.length > 0) {
        this.lastYieldedLength = this.buffer.length;
        yield newContent;
      }
    } else {
      // Character-by-character mode (causes state update issues, use sparingly)
      for (let i = 0; i < newContent.length; i += this.charsPerChunk) {
        const chunk = newContent.slice(i, i + this.charsPerChunk);
        this.lastYieldedLength += chunk.length;
        yield chunk;
        await sleep(this.delayMs);
      }
    }
  }

  /**
   * Get remaining buffered content that hasn't been yielded yet
   */
  getRemaining(): string {
    return this.buffer.slice(this.lastYieldedLength);
  }

  /**
   * Reset the streamer
   */
  reset(): void {
    this.buffer = "";
    this.lastYieldedLength = 0;
  }

  /**
   * Flush remaining content immediately
   */
  flush(): string {
    const remaining = this.getRemaining();
    this.lastYieldedLength = this.buffer.length;
    return remaining;
  }
}

/**
 * Helper: Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detect if content should use fake streaming
 * Use for short messages or filtered content
 */
export function shouldUseFakeStream(contentLength: number, sourceChunkCount: number): boolean {
  // Use fake stream if:
  // - Content is short (< 500 chars) and came from multiple chunks (likely filtered)
  // - Or content is very short (< 100 chars) regardless of source
  return (contentLength < 500 && sourceChunkCount > 3) || contentLength < 100;
}

/**
 * Adaptive delay based on content length
 * Shorter content = slower (more deliberate)
 * Longer content = faster (less waiting)
 */
export function adaptiveDelay(contentLength: number): number {
  if (contentLength < 100) return 15; // Slow for short messages
  if (contentLength < 500) return 10; // Medium for normal
  if (contentLength < 2000) return 6;  // Faster for long
  return 4; // Very fast for very long
}

/**
 * Throttle state updates using requestAnimationFrame
 * Prevents "Maximum update depth exceeded" errors
 */
export function createThrottledUpdate<T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 16 // ~60fps
): T {
  let lastCall = 0;
  let pendingArgs: Parameters<T> | null = null;
  let rafId: number | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    pendingArgs = args;

    if (rafId !== null) {
      return; // Already scheduled
    }

    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      // Can execute immediately
      lastCall = now;
      fn(...pendingArgs!);
      pendingArgs = null;
    } else {
      // Schedule for next frame
      rafId = requestAnimationFrame(() => {
        rafId = null;
        lastCall = Date.now();
        if (pendingArgs) {
          fn(...pendingArgs);
          pendingArgs = null;
        }
      });
    }
  }) as T;
}
