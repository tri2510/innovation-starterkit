/**
 * Retry Mechanism with Exponential Backoff
 * Handles transient errors and rate limiting gracefully
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface RetryStrategy {
  shouldRetry: boolean;
  backoff: 'exponential' | 'linear' | 'immediate';
  maxRetries: number;
  baseDelay: number;
}

/**
 * Analyze error and determine retry strategy
 */
export function getRetryStrategy(error: Error): RetryStrategy {
  const errorMsg = error.message.toLowerCase();

  // Rate limiting errors - need longer backoff
  if (
    errorMsg.includes('429') ||
    errorMsg.includes('rate limit') ||
    errorMsg.includes('too many requests') ||
    errorMsg.includes('concurrent') ||
    errorMsg.includes('quota exceeded')
  ) {
    return {
      shouldRetry: true,
      backoff: 'exponential',
      maxRetries: 5,
      baseDelay: 2000 // Start with 2 seconds for rate limits
    };
  }

  // Server errors - moderate backoff
  if (
    errorMsg.includes('500') ||
    errorMsg.includes('502') ||
    errorMsg.includes('503') ||
    errorMsg.includes('504') ||
    errorMsg.includes('service unavailable') ||
    errorMsg.includes('temporary')
  ) {
    return {
      shouldRetry: true,
      backoff: 'linear',
      maxRetries: 3,
      baseDelay: 1000
    };
  }

  // Network errors - exponential backoff
  if (
    errorMsg.includes('network') ||
    errorMsg.includes('connection') ||
    errorMsg.includes('econnrefused') ||
    errorMsg.includes('etimedout') ||
    errorMsg.includes('fetch')
  ) {
    return {
      shouldRetry: true,
      backoff: 'exponential',
      maxRetries: 4,
      baseDelay: 1500
    };
  }

  // Default: don't retry
  return {
    shouldRetry: false,
    backoff: 'immediate',
    maxRetries: 0,
    baseDelay: 0
  };
}

/**
 * Calculate delay with backoff strategy
 */
function calculateDelay(
  attempt: number,
  strategy: RetryStrategy,
  maxDelay: number = 30000
): number {
  let delay: number;

  switch (strategy.backoff) {
    case 'exponential':
      delay = strategy.baseDelay * Math.pow(2, attempt);
      break;
    case 'linear':
      delay = strategy.baseDelay * (attempt + 1);
      break;
    case 'immediate':
    default:
      delay = 0;
      break;
  }

  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  delay += jitter;

  // Cap at maximum delay
  return Math.min(delay, maxDelay);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      const customShouldRetry = shouldRetry?.(lastError);
      const strategy = getRetryStrategy(lastError);

      if (!customShouldRetry && !strategy.shouldRetry) {
        throw lastError; // Don't retry this error
      }

      if (attempt === maxRetries) {
        throw lastError; // Max retries reached
      }

      // Use the more conservative of the two strategies
      const effectiveMaxRetries = Math.min(maxRetries, strategy.maxRetries);
      if (attempt >= effectiveMaxRetries) {
        throw lastError;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, strategy, maxDelay);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError, delay);
      }

      // Log retry for monitoring
      console.log(
        `Retry attempt ${attempt + 1}/${effectiveMaxRetries} after ${Math.round(delay)}ms`,
        `Error: ${lastError.message}`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Check if error is retryable based on common patterns
 */
export function isRetryableError(error: Error): boolean {
  const strategy = getRetryStrategy(error);
  return strategy.shouldRetry;
}

/**
 * Create a wrapped function with automatic retry logic
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): () => Promise<T> {
  return () => retryWithBackoff(fn, options);
}