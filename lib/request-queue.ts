/**
 * Request Queue System for API Rate Limiting
 * Manages concurrent requests to prevent exceeding API limits
 */

interface QueuedRequest<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: number;
  timestamp: number;
}

export class APIRequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private activeCount = 0;
  private readonly maxConcurrent: number;
  private processingTimer: ReturnType<typeof setImmediate> | null = null;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Execute a function with queue management
   * Higher priority numbers = higher priority (default: 0)
   */
  async execute<T>(
    fn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest<T> = {
        fn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      this.queue.push(request);
      this.queue.sort((a, b) => {
        // Sort by priority first, then by timestamp for same priority
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      this.processQueue();
    });
  }

  /**
   * Process the queue and execute pending requests
   */
  private processQueue(): void {
    if (this.processingTimer) {
      return; // Already processing
    }

    this.processingTimer = setImmediate(() => {
      this.processingTimer = null;
      this.processNext();
    });
  }

  /**
   * Process next request in queue if capacity available
   */
  private processNext(): void {
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeCount++;

      // Execute the request and handle completion
      request.fn()
        .then(result => {
          request.resolve(result);
        })
        .catch(error => {
          request.reject(error);
        })
        .finally(() => {
          this.activeCount--;
          // Process next item after current one completes
          this.processQueue();
        });
    }
  }

  /**
   * Get current queue status
   */
  getStatus(): {
    activeRequests: number;
    queuedRequests: number;
    maxConcurrent: number;
  } {
    return {
      activeRequests: this.activeCount,
      queuedRequests: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * Clear all pending requests (useful for shutdown)
   */
  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// Global singleton instance
let globalQueue: APIRequestQueue | null = null;

/**
 * Get or create the global request queue
 */
export function getGlobalQueue(maxConcurrent?: number): APIRequestQueue {
  if (!globalQueue) {
    globalQueue = new APIRequestQueue(maxConcurrent || 3);
  }
  return globalQueue;
}

/**
 * Execute a function with automatic queue management
 */
export async function withQueue<T>(
  fn: () => Promise<T>,
  priority: number = 0
): Promise<T> {
  const queue = getGlobalQueue();
  return queue.execute(fn, priority);
}