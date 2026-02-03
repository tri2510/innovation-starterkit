/**
 * Centralized configuration with defaults
 * Only API keys need to be set as environment variables
 */

// API Keys (Required - no defaults for security)
export const config = {
  // OpenAI API Configuration (using Z.AI OpenAI-compatible endpoint)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.z.ai/api/paas/v4/',
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'glm-4.7',
  },

  // Tavily Search API (Optional - for web search features)
  tavily: {
    apiKey: process.env.TAVILY_API_KEY || '',
  },

  // API Client Settings (with sensible defaults)
  api: {
    timeout: parseInt(process.env.API_TIMEOUT || '180000', 10),
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

  if (!config.openai.apiKey) {
    missing.push('OPENAI_API_KEY');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
