/**
 * Market Analysis Utility Functions
 * Extract business logic from market page for better maintainability
 */

import type { MarketAnalysis, MarketTrend, Competitor } from "@/types/innovation";

export interface MarketProgressItem {
  id: string;
  label: string;
  icon?: any;
  status: "waiting" | "gathering" | "awaiting_confirmation" | "complete";
  excerpt?: string;
  isOptional?: boolean;
}

export const defaultMarketProgress: MarketProgressItem[] = [
  { id: "market_size", label: "Market Size (TAM/SAM/SOM)", status: "waiting", isOptional: false },
  { id: "trends", label: "Market Trends", status: "waiting", isOptional: false },
  { id: "competitors", label: "Competitive Landscape", status: "waiting", isOptional: false },
  { id: "opportunities", label: "Market Opportunities", status: "waiting", isOptional: false },
  { id: "challenges", label: "Market Challenges", status: "waiting", isOptional: true },
];

export function calculateMarketProgress(items: MarketProgressItem[]): number {
  let score = 0;
  let maxScore = 0;
  items.forEach(item => {
    const weight = item.isOptional ? 0.5 : 1;
    maxScore += weight * 100;
    if (item.status === "complete") score += weight * 100;
    else if (item.status === "awaiting_confirmation") score += weight * 75;
    else if (item.status === "gathering") score += weight * 50;
  });
  return Math.round((score / maxScore) * 100);
}

export function getCelebrationMessage(sectionId: string): string | null {
  const messages: Record<string, string> = {
    market_size: "Great! I understand your market size. Now let's explore key trends.",
    trends: "Excellent! Got the market trends. Next, let's analyze competitors.",
    competitors: "Perfect! I have a clear picture of the competition. Now for opportunities.",
    opportunities: "Fantastic! Market opportunities identified. Analysis almost complete!",
  };
  return messages[sectionId] || null;
}

export function getMarketProgressTip(
  overallProgress: number,
  isComplete: boolean,
  celebrationMessage: string | null
): { icon: any; text: string; type: string } | null {
  if (celebrationMessage) {
    return { icon: "CheckCircle2", text: celebrationMessage, type: "celebration" };
  }
  if (isComplete) {
    return { icon: "BadgeCheck", text: "Market analysis complete! Review findings or click 'Generate Ideas' to continue.", type: "success" };
  }
  if (overallProgress >= 75) {
    return { icon: "Sparkles", text: "Great progress! Building comprehensive market insights.", type: "normal" };
  }
  if (overallProgress >= 50) {
    return { icon: "Sparkles", text: "Halfway there! Each insight improves your market understanding.", type: "normal" };
  }
  if (overallProgress >= 25) {
    return { icon: "Sparkles", text: "Good start! Market expertise is building.", type: "normal" };
  }
  if (overallProgress > 0) {
    return { icon: "Sparkles", text: "Let's analyze your market! Share what you know.", type: "normal" };
  }
  return null;
}

export function extractMarketValue(text: string): { value: string; description: string } {
  if (!text || typeof text !== 'string') {
    return { value: 'N/A', description: 'No data available' };
  }

  // Match formats like "$5.2B", "$1.1B", "$55M", etc.
  const valueMatch = text.match(/\$?[\d.]+[BMK]\b/i);
  const value = valueMatch ? valueMatch[0] : text;

  // Extract description by removing the value and any leading separators
  let description = text.replace(value, '').trim();
  
  // Remove common separators like "-", ":", etc. at the start
  description = description.replace(/^[-:]\s*/, '').trim();

  return { value, description };
}

export function getMomentumIcon(momentum: MarketTrend["momentum"]): any {
  switch (momentum) {
    case "rising": return "TrendingUp";
    case "declining": return "TrendingDown";
    case "stable": return "Minus";
  }
}

export function createMarketProgressFromAnalysis(marketAnalysis: MarketAnalysis): MarketProgressItem[] {
  return [
    { id: "market_size", label: "Market Size (TAM/SAM/SOM)", status: "complete", excerpt: marketAnalysis.tam, isOptional: false },
    { id: "trends", label: "Market Trends", status: "complete", excerpt: `${marketAnalysis.trends?.length || 0} trends identified`, isOptional: false },
    { id: "competitors", label: "Competitive Landscape", status: "complete", excerpt: `${marketAnalysis.competitors?.length || 0} competitors analyzed`, isOptional: false },
    { id: "opportunities", label: "Market Opportunities", status: "complete", excerpt: `${marketAnalysis.opportunities?.length || 0} opportunities found`, isOptional: false },
    { id: "challenges", label: "Market Challenges", status: marketAnalysis.challenges?.length ? "complete" : "waiting", excerpt: marketAnalysis.challenges?.length ? `${marketAnalysis.challenges.length} challenges` : "", isOptional: true },
  ];
}