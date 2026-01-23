import { z } from "zod";

/**
 * Simplified Zod schemas for type-safe AI responses
 * Clean validation without complex business logic
 */

// Progress update schema for real-time UI updates
export const ProgressUpdateSchema = z.object({
  field: z.enum(["problem", "targetAudience", "currentSolutions", "industry", "context"]),
  status: z.enum(["gathering", "awaiting_confirmation", "complete"]),
  excerpt: z.string().min(5).max(500)
});

// Market progress update schema for market analysis with partial data
export const MarketProgressUpdateSchema = z.object({
  section: z.enum(["market_size", "trends", "competitors", "opportunities", "challenges"]),
  status: z.enum(["gathering", "awaiting_confirmation", "complete"]),
  excerpt: z.string().min(5).max(500),
  progressPercentage: z.number().min(0).max(100).optional(),
  partialData: z.object({
    tam: z.string().nullable().optional(),
    sam: z.string().nullable().optional(),
    som: z.string().nullable().optional(),
    trends: z.array(z.object({
      name: z.string(),
      description: z.string(),
      momentum: z.enum(["rising", "stable", "declining"]).optional(),
      impact: z.enum(["high", "medium", "low"]).optional()
    })).nullable().optional(),
    competitors: z.array(z.object({
      name: z.string(),
      strengths: z.string().nullable().optional(),
      weaknesses: z.string().nullable().optional(),
      marketShare: z.string().nullable().optional()
    })).nullable().optional(),
    opportunities: z.array(z.string()).nullable().optional(),
    challenges: z.array(z.string()).nullable().optional()
  }).optional()
});

// Structured response schema
export const StructuredAIResponseSchema = z.object({
  message: z.string().min(1),
  progress_update: ProgressUpdateSchema
});

// Challenge summary schema
export const ChallengeSummarySchema = z.object({
  problem: z.string().min(10),
  targetAudience: z.string().min(10),
  currentSolutions: z.string().min(10),
  industry: z.string().optional().nullable(),
  context: z.string().optional().nullable()
});

// Market analysis schema
export const MarketAnalysisSchema = z.object({
  tam: z.string().min(20),
  sam: z.string().min(20), 
  som: z.string().min(20),
  trends: z.array(z.object({
    name: z.string(),
    description: z.string(),
    momentum: z.enum(["rising", "stable", "declining"]),
    impact: z.enum(["high", "medium", "low"])
  })).min(3),
  competitors: z.array(z.object({
    name: z.string(),
    strengths: z.array(z.string()).min(2),
    weaknesses: z.array(z.string()).min(2),
    marketShare: z.string().optional()
  })).min(2),
  opportunities: z.array(z.string()).min(3),
  challenges: z.array(z.string()).min(3)
});

// Business idea schema
// Fields generated in ideate phase: id, name, tagline, description, problemSolved, searchFields
// Fields generated in appraisal phase: targetMarket, businessModel, revenueStreams, competitiveAdvantage, estimatedInvestment, timeframe, metrics
export const BusinessIdeaSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string().min(50),
  problemSolved: z.string(),
  searchFields: z.object({
    industries: z.array(z.string()),
    technologies: z.array(z.string()),
    reasoning: z.string()
  }).optional(),
  // Optional fields generated in appraisal phase
  targetMarket: z.string().optional(),
  businessModel: z.string().optional(),
  revenueStreams: z.array(z.string()).min(2).optional(),
  competitiveAdvantage: z.string().optional(),
  estimatedInvestment: z.string().optional(),
  timeframe: z.string().optional(),
  metrics: z.object({
    problemClarity: z.object({
      score: z.number().min(0).max(100),
      weight: z.number(),
      feedback: z.string()
    }),
    marketSize: z.object({
      score: z.number().min(0).max(100),
      weight: z.number(),
      feedback: z.string()
    }),
    innovation: z.object({
      score: z.number().min(0).max(100),
      weight: z.number(),
      feedback: z.string()
    }),
    financialViability: z.object({
      score: z.number().min(0).max(100),
      weight: z.number(),
      feedback: z.string()
    }),
    strategicFit: z.object({
      score: z.number().min(0).max(100),
      weight: z.number(),
      feedback: z.string()
    }),
    marketFit: z.object({
      score: z.number().min(0).max(100),
      weight: z.number(),
      feedback: z.string()
    }),
    overallScore: z.number().min(0).max(100),
    roi: z.enum(["high", "medium", "low"]),
    risk: z.enum(["high", "medium", "low"])
  }).optional()
});

// Pitch deck schema
export const PitchDeckSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  slides: z.array(z.object({
    id: z.string(),
    type: z.enum(["title", "problem", "solution", "market", "business-model", "competition", "ask"]),
    title: z.string(),
    content: z.record(z.string(), z.any())
  })).min(5)
});

// Type exports
export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;
export type MarketProgressUpdate = z.infer<typeof MarketProgressUpdateSchema>;
export type ChallengeSummary = z.infer<typeof ChallengeSummarySchema>;
export type MarketAnalysis = z.infer<typeof MarketAnalysisSchema>;
export type BusinessIdea = z.infer<typeof BusinessIdeaSchema>;
export type PitchDeck = z.infer<typeof PitchDeckSchema>;
export type StructuredAIResponse = z.infer<typeof StructuredAIResponseSchema>;