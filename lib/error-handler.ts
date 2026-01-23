/**
 * Enhanced Error Handling and Categorization
 * Provides detailed error analysis and user-friendly messages
 */

export enum ErrorCategory {
  RATE_LIMIT = 'rate_limit',
  API_KEY = 'api_key',
  NETWORK = 'network',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorAnalysis {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  shouldRetry: boolean;
  suggestedActions: string[];
}

/**
 * Analyze error and provide detailed breakdown
 */
export function analyzeError(error: Error | string): ErrorAnalysis {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorMsg = errorMessage.toLowerCase();

  // Rate limiting errors
  if (
    errorMsg.includes('429') ||
    errorMsg.includes('rate limit') ||
    errorMsg.includes('too many requests') ||
    errorMsg.includes('concurrent') ||
    errorMsg.includes('quota exceeded') ||
    errorMsg.includes('credit')
  ) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'The service is currently experiencing high demand. Please wait a moment and try again.',
      technicalMessage: `Rate limit exceeded: ${errorMessage}`,
      shouldRetry: true,
      suggestedActions: [
        'Wait 30-60 seconds before retrying',
        'Reduce the number of concurrent requests',
        'Consider upgrading your API plan',
        'Check if other users are making requests'
      ]
    };
  }

  // API key errors
  if (
    errorMsg.includes('api key') ||
    errorMsg.includes('unauthorized') ||
    errorMsg.includes('401') ||
    errorMsg.includes('authentication') ||
    errorMsg.includes('invalid key') ||
    errorMsg.includes('credentials')
  ) {
    return {
      category: ErrorCategory.API_KEY,
      severity: ErrorSeverity.CRITICAL,
      userMessage: 'There is an issue with the API configuration. Please contact support.',
      technicalMessage: `Authentication failed: ${errorMessage}`,
      shouldRetry: false,
      suggestedActions: [
        'Check API key configuration',
        'Verify API key is valid and not expired',
        'Check environment variables',
        'Contact administrator if issue persists'
      ]
    };
  }

  // Network errors
  if (
    errorMsg.includes('network') ||
    errorMsg.includes('connection') ||
    errorMsg.includes('econnrefused') ||
    errorMsg.includes('fetch') ||
    errorMsg.includes('dns') ||
    errorMsg.includes('enotfound')
  ) {
    return {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
      technicalMessage: `Network error: ${errorMessage}`,
      shouldRetry: true,
      suggestedActions: [
        'Check internet connection',
        'Verify API endpoint is reachable',
        'Check firewall settings',
        'Retry the request'
      ]
    };
  }

  // Timeout errors
  if (
    errorMsg.includes('timeout') ||
    errorMsg.includes('aborted') ||
    errorMsg.includes('timed out')
  ) {
    return {
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'The request took too long to complete. Please try again.',
      technicalMessage: `Request timeout: ${errorMessage}`,
      shouldRetry: true,
      suggestedActions: [
        'Check if the API is responding normally',
        'Reduce request complexity',
        'Increase timeout settings',
        'Retry with a simpler request'
      ]
    };
  }

  // Server errors
  if (
    errorMsg.includes('500') ||
    errorMsg.includes('502') ||
    errorMsg.includes('503') ||
    errorMsg.includes('504') ||
    errorMsg.includes('service unavailable') ||
    errorMsg.includes('internal server error')
  ) {
    return {
      category: ErrorCategory.SERVER,
      severity: ErrorSeverity.HIGH,
      userMessage: 'The service is temporarily unavailable. Please try again later.',
      technicalMessage: `Server error: ${errorMessage}`,
      shouldRetry: true,
      suggestedActions: [
        'Wait a few minutes before retrying',
        'Check service status page',
        'Report if issue persists',
        'Try with different parameters'
      ]
    };
  }

  // Validation errors
  if (
    errorMsg.includes('validation') ||
    errorMsg.includes('invalid') ||
    errorMsg.includes('400') ||
    errorMsg.includes('bad request') ||
    errorMsg.includes('schema') ||
    errorMsg.includes('parse error')
  ) {
    return {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      userMessage: 'There was an issue with the request format. Please try again.',
      technicalMessage: `Validation error: ${errorMessage}`,
      shouldRetry: false,
      suggestedActions: [
        'Check request parameters',
        'Verify data format',
        'Review error details',
        'Contact support if needed'
      ]
    };
  }

  // Unknown errors
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'An unexpected error occurred. Please try again or contact support.',
    technicalMessage: `Unknown error: ${errorMessage}`,
    shouldRetry: true,
    suggestedActions: [
      'Retry the request',
      'Check application logs',
      'Report the issue if it persists',
      'Contact support with error details'
    ]
  };
}

/**
 * Get user-friendly error message based on error analysis
 */
export function getUserFriendlyMessage(error: Error | string): string {
  const analysis = analyzeError(error);
  return analysis.userMessage;
}

/**
 * Check if error should be retried based on category
 */
export function shouldErrorBeRetried(error: Error | string): boolean {
  const analysis = analyzeError(error);
  return analysis.shouldRetry;
}

/**
 * Log error with structured information
 */
export function logStructuredError(error: Error | string, context?: Record<string, any>): void {
  const analysis = analyzeError(error);
  const errorLog = {
    timestamp: new Date().toISOString(),
    category: analysis.category,
    severity: analysis.severity,
    message: typeof error === 'string' ? error : error.message,
    technicalMessage: analysis.technicalMessage,
    shouldRetry: analysis.shouldRetry,
    context: context || {}
  };

  console.error('Structured Error:', JSON.stringify(errorLog, null, 2));
}

/**
 * Create enhanced error with additional context
 */
export class EnhancedError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory,
    public severity: ErrorSeverity,
    public originalError?: Error,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'EnhancedError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      originalMessage: this.originalError?.message,
      context: this.context
    };
  }
}

/**
 * Wrap error with enhanced information
 */
export function wrapError(
  error: Error | string,
  category?: ErrorCategory,
  context?: Record<string, any>
): EnhancedError {
  const analysis = analyzeError(error);
  const errorObj = typeof error === 'string' ? new Error(error) : error;

  return new EnhancedError(
    analysis.userMessage,
    category || analysis.category,
    analysis.severity,
    errorObj,
    context
  );
}