/**
 * Centralized configuration with defaults
 * Only API keys need to be set as environment variables
 */

// API Keys (Required - no defaults for security)
export const config = {
  // AI API Configuration (z.ai Anthropic-compatible endpoint)
  anthropic: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.z.ai/api/anthropic',
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'glm-4.7',
  },

  // Tavily Search API (Optional - for web search features)
  tavily: {
    apiKey: process.env.TAVILY_API_KEY || '',
  },

  // API Client Settings (with sensible defaults)
  api: {
    timeout: parseInt(process.env.API_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.API_MAX_RETRIES || '3', 10),
  },

  // Feature Flags
  features: {
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
    disableTour: process.env.NEXT_PUBLIC_DISABLE_TOUR === 'true',
  },
} as const;

// Validate required API keys on import
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!config.anthropic.apiKey) {
    missing.push('OPENAI_API_KEY');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
