/**
 * Appraisal Utility Functions
 * Progress tracking for business idea appraisal (merged with financial model)
 * Like ideate-utils.ts pattern
 */

import type { LucideIcon } from "lucide-react";
import { Users, Briefcase, Award, DollarSign, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";

export type AppraisalProgressStatus = "waiting" | "gathering" | "complete";

export interface AppraisalProgressItem {
  id: string;
  label: string;
  icon: LucideIcon;
  status: AppraisalProgressStatus;
  excerpt?: string;
}

export interface ProgressTip {
  text: string;
  type: "success" | "normal" | "celebration";
}

// 7 appraisal sections (business idea fields + financial model merged)
export const defaultAppraisalProgress: AppraisalProgressItem[] = [
  { id: "target_market", label: "Target Market", icon: Users, status: "waiting" },
  { id: "business_model", label: "Business Model", icon: Briefcase, status: "waiting" },
  { id: "competitive_advantage", label: "Competitive Advantage", icon: Award, status: "waiting" },
  { id: "investment_costs", label: "Investment & Costs", icon: DollarSign, status: "waiting" },
  { id: "revenue_forecasts", label: "Revenue Forecasts", icon: TrendingUp, status: "waiting" },
  { id: "financial_metrics", label: "Financial Metrics", icon: BarChart3, status: "waiting" },
  { id: "risk_assessment", label: "Risk & Timeline", icon: AlertTriangle, status: "waiting" },
];

export function calculateAppraisalProgress(items: AppraisalProgressItem[]): number {
  const completedCount = items.filter(i => i.status === "complete").length;
  const gatheringCount = items.filter(i => i.status === "gathering").length;
  return Math.round(((completedCount * 100 + gatheringCount * 50) / (items.length * 100)) * 100);
}

export function getAppraisalProgressTip(
  overallProgress: number,
  hasAppraisal: boolean,
  celebrationMessage: string | null = null
): ProgressTip | null {
  // Celebration message takes priority
  if (celebrationMessage) {
    return { text: celebrationMessage, type: "celebration" };
  }

  if (hasAppraisal) {
    return { text: "Appraisal complete! Review the detailed analysis on the right, or ask me to refine any section.", type: "success" };
  }

  if (overallProgress >= 75) {
    return { text: "Great progress! Almost there with your appraisal...", type: "normal" };
  }
  if (overallProgress >= 50) {
    return { text: "Halfway through! Building comprehensive financial analysis...", type: "normal" };
  }
  if (overallProgress >= 25) {
    return { text: "Making progress! Analyzing business model and competitive landscape...", type: "normal" };
  }
  if (overallProgress > 0) {
    return { text: "Getting started! Gathering market and financial insights...", type: "normal" };
  }

  return { text: "Ready to build your investment appraisal? Click 'Generate Appraisal' to analyze the business model, financial projections, and risks.", type: "normal" };
}
