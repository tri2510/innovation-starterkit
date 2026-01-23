/**
 * Enhanced API Client with Queue and Retry Management
 * Integrates request queue, retry logic, and error handling
 */

import { withQueue, getGlobalQueue } from './request-queue';
import { retryWithBackoff, getRetryStrategy } from './retry';
import { analyzeError, wrapError, logStructuredError, ErrorCategory } from './error-handler';

export interface APIRequestOptions {
  priority?: number;
  maxRetries?: number;
  timeout?: number;
  context?: Record<string, any>;
}

/**
 * Enhanced API client with automatic queue and retry management
 */
export class APIClient {
  private defaultTimeout: number;
  private defaultMaxRetries: number;

  constructor(
    defaultTimeout: number = 60000,
    defaultMaxRetries: number = 3
  ) {
    this.defaultTimeout = defaultTimeout;
    this.defaultMaxRetries = defaultMaxRetries;
  }

  /**
   * Execute API request with queue, retry, and error handling
   */
  async execute<T>(
    requestFn: () => Promise<T>,
    options: APIRequestOptions = {}
  ): Promise<T> {
    const {
      priority = 0,
      maxRetries = this.defaultMaxRetries,
      timeout = this.defaultTimeout,
      context = {}
    } = options;

    return withQueue(async () => {
      return retryWithBackoff(
        async () => {
          try {
            // Add timeout to the request
            const result = await this.withTimeout(requestFn(), timeout);
            return result;
          } catch (error) {
            // Enhance error with context
            const enhancedError = wrapError(error as Error, undefined, {
              ...context,
              priority,
              timeout,
              attempt: 'execution'
            });

            // Log structured error
            logStructuredError(enhancedError, context);

            throw enhancedError;
          }
        },
        {
          maxRetries,
          onRetry: (attempt, error, delay) => {
            const strategy = getRetryStrategy(error as Error);
            console.log(
              `API retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms - ` +
              `Category: ${analyzeError(error).category}, ` +
              `Strategy: ${strategy.backoff} backoff`
            );
          }
        }
      );
    }, priority);
  }

  /**
   * Add timeout to promise
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return getGlobalQueue().getStatus();
  }
}

/**
 * Global API client instance
 */
let globalAPIClient: APIClient | null = null;

/**
 * Get or create global API client
 */
export function getAPIClient(): APIClient {
  if (!globalAPIClient) {
    globalAPIClient = new APIClient(
      parseInt(process.env.API_TIMEOUT || '60000'),
      parseInt(process.env.API_MAX_RETRIES || '3')
    );
  }
  return globalAPIClient;
}

/**
 * Convenience function to execute API request with all features
 */
export async function executeAPIRequest<T>(
  requestFn: () => Promise<T>,
  options?: APIRequestOptions
): Promise<T> {
  const client = getAPIClient();
  return client.execute(requestFn, options);
}

/**
 * Execute high-priority request (bypasses queue when possible)
 */
export async function executeHighPriorityRequest<T>(
  requestFn: () => Promise<T>,
  options?: Omit<APIRequestOptions, 'priority'>
): Promise<T> {
  return executeAPIRequest(requestFn, { ...options, priority: 10 });
}

/**
 * Execute low-priority request (background tasks)
 */
export async function executeLowPriorityRequest<T>(
  requestFn: () => Promise<T>,
  options?: Omit<APIRequestOptions, 'priority'>
): Promise<T> {
  return executeAPIRequest(requestFn, { ...options, priority: -5 });
}