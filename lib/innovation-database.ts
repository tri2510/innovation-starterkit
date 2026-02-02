import type {
  Industry,
  RadarScores,
  BusinessIdea,
  QuickFinancialPreview,
} from '@/types/innovation';

/**
 * Innovation Database Utility
 *
 * This module provides functions to connect to and query an innovation database.
 * In production, this would connect to a real database with historical innovation data.
 * For now, it uses mock data based on industry benchmarks.
 */

// Mock innovation database with industry benchmarks
const INDUSTRY_BENCHMARKS: Record<Industry, RadarScores> = {
  manufacturing: {
    marketFit: 68,
    innovation: 72,
    financialViability: 65,
    strategicFit: 70,
    riskLevel: 64,
    marketSize: 66,
  },
  healthcare: {
    marketFit: 75,
    innovation: 78,
    financialViability: 70,
    strategicFit: 73,
    riskLevel: 68,
    marketSize: 74,
  },
  automotive: {
    marketFit: 65,
    innovation: 70,
    financialViability: 62,
    strategicFit: 68,
    riskLevel: 60,
    marketSize: 67,
  },
  agriculture: {
    marketFit: 63,
    innovation: 68,
    financialViability: 60,
    strategicFit: 65,
    riskLevel: 62,
    marketSize: 64,
  },
};

// Additional benchmarks based on technology focus
const TECHNOLOGY_MULTIPLIERS: Record<string, Partial<RadarScores>> = {
  'ai-edge': {
    innovation: 10,
    financialViability: 5,
    riskLevel: 5,
  },
  'sdv': {
    innovation: 8,
    strategicFit: 7,
    riskLevel: 3,
  },
  'robotics': {
    innovation: 7,
    financialViability: 4,
    riskLevel: 2,
  },
  'virtualization': {
    innovation: 5,
    financialViability: 6,
    riskLevel: 4,
  },
  'cloud': {
    innovation: 4,
    financialViability: 7,
    riskLevel: 5,
  },
};

/**
 * Get industry benchmarks for display
 */
export function getIndustryBenchmarks(industry: Industry): RadarScores {
  return INDUSTRY_BENCHMARKS[industry];
}

/**
 * Calculate radar scores from idea metrics (if already scored)
 */
export function calculateRadarScoresFromIdea(
  idea: BusinessIdea,
  marketTam?: string
): RadarScores {
  // If idea has detailed metrics, use them
  if (idea.metrics && 'overallScore' in idea.metrics) {
    const detailed = idea.metrics as any;
    return {
      marketFit: detailed.marketFit?.score || 70,
      innovation: detailed.innovation?.score || 70,
      financialViability: detailed.financialViability?.score || 70,
      strategicFit: detailed.strategicFit?.score || 70,
      riskLevel: 70, // Default risk
      marketSize: detailed.marketSize?.score || 70,
    };
  }

  // Otherwise, use basic metrics
  if (idea.metrics) {
    return {
      marketFit: idea.metrics.marketFit || 70,
      innovation: idea.metrics.innovation || 70,
      financialViability: idea.metrics.feasibility || 70,
      strategicFit: 70,
      riskLevel: idea.metrics.risk === 'low' ? 80 : idea.metrics.risk === 'medium' ? 60 : 40,
      marketSize: 70,
    };
  }

  // Generate default scores based on market size
  const marketScore = parseMarketSize(marketTam);
  return {
    marketFit: 70,
    innovation: 70,
    financialViability: 70,
    strategicFit: 70,
    riskLevel: 65,
    marketSize: marketScore,
  };
}

/**
 * Parse market size string to score
 */
function parseMarketSize(marketStr?: string): number {
  if (!marketStr) return 70;

  const value = extractMarketValue(marketStr);

  // Simple logic: larger market = higher score
  if (value >= 100) return 90; // $100B+
  if (value >= 50) return 85; // $50B+
  if (value >= 10) return 80; // $10B+
  if (value >= 5) return 75; // $5B+
  if (value >= 1) return 70; // $1B+
  return 65; // < $1B
}

/**
 * Extract numeric value from market size string
 */
function extractMarketValue(marketStr: string): number {
  // Match patterns like "$10B", "5 billion", "$500M", etc.
  const match = marketStr.match(/[\d.]+/);
  if (!match) return 0;

  const value = parseFloat(match[0]);
  const lower = marketStr.toLowerCase();

  if (lower.includes('b') || lower.includes('billion')) {
    return value;
  }
  if (lower.includes('m') || lower.includes('million')) {
    return value / 1000;
  }
  if (lower.includes('k') || lower.includes('thousand')) {
    return value / 1000000;
  }

  return value;
}

/**
 * Get sample size for industry database
 */
export function getDatabaseSampleSize(industry: Industry): number {
  const sizes: Record<Industry, number> = {
    manufacturing: 2450,
    healthcare: 1890,
    automotive: 1200,
    agriculture: 980,
  };
  return sizes[industry];
}

/**
 * Get last updated timestamp for database
 */
export function getDatabaseLastUpdated(): string {
  // In production, this would come from the actual database
  return new Date().toISOString();
}
