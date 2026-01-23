import type { LucideIcon } from "lucide-react";
import { Users, Building, Building2, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";

/**
 * Progress item type for Investment Appraisal phase
 * Tracks the completion status of each financial section
 */
export interface InvestmentProgressItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  status: "waiting" | "gathering" | "awaiting_confirmation" | "complete";
  excerpt?: string;
  isOptional?: boolean;
}

/**
 * Default progress items for the 6 investment sections
 */
export const defaultInvestmentProgress: InvestmentProgressItem[] = [
  { id: "personnel_costs", label: "Personnel Costs", icon: Users, status: "waiting" as const, isOptional: false },
  { id: "operating_expenses", label: "Operating Expenses", icon: Building, status: "waiting" as const, isOptional: false },
  { id: "capital_investments", label: "Capital Investments", icon: Building2, status: "waiting" as const, isOptional: false },
  { id: "revenue_forecasts", label: "Revenue Forecasts", icon: TrendingUp, status: "waiting" as const, isOptional: false },
  { id: "financial_analysis", label: "Financial Analysis", icon: BarChart3, status: "waiting" as const, isOptional: false },
  { id: "risk_assessment", label: "Risk Assessment", icon: AlertTriangle, status: "waiting" as const, isOptional: false },
];

/**
 * Calculate overall progress percentage for investment appraisal
 * Weights optional sections at 0.5x, required sections at 1x
 */
export function calculateInvestmentProgress(items: InvestmentProgressItem[]): number {
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

/**
 * Get progress tip based on current state
 * Returns appropriate message, icon, and type for the progress banner
 */
export function getInvestmentProgressTip(
  overallProgress: number,
  isComplete: boolean,
  celebrationMessage: string | null,
  activeSectionId?: string
): { icon: LucideIcon; text: string; type: string } | null {
  if (celebrationMessage) {
    return { icon: Users, text: celebrationMessage, type: "celebration" };
  }

  // Skip showing the complete message - it's redundant
  if (isComplete) {
    return null;
  }

  if (activeSectionId) {
    const messages: Record<string, { icon: LucideIcon; text: string; type: string }> = {
      personnel_costs: { icon: Users, text: "Building your team structure and salary projections...", type: "progress" },
      operating_expenses: { icon: Building, text: "Calculating operating expenses and overhead costs...", type: "progress" },
      capital_investments: { icon: Building2, text: "Determining capital investments and equipment needs...", type: "progress" },
      revenue_forecasts: { icon: TrendingUp, text: "Projecting 5-year revenue forecasts...", type: "progress" },
      financial_analysis: { icon: BarChart3, text: "Analyzing ROI, NPV, IRR and key financial metrics...", type: "progress" },
      risk_assessment: { icon: AlertTriangle, text: "Evaluating risk factors and viability...", type: "progress" },
    };
    return messages[activeSectionId] || null;
  }

  if (overallProgress === 0) {
    return { icon: TrendingUp, text: "Ready to build your financial model. Click 'Generate Appraisal' to get started!", type: "info" };
  }

  if (overallProgress < 25) {
    return { icon: Users, text: "Good start! Let's continue building out your financial projections.", type: "info" };
  }

  if (overallProgress < 50) {
    return { icon: BarChart3, text: "Making progress! Keep going to complete your financial model.", type: "info" };
  }

  if (overallProgress < 75) {
    return { icon: TrendingUp, text: "Great progress! Almost halfway through the financial model.", type: "info" };
  }

  return { icon: AlertTriangle, text: "You're doing great! Let's finalize your investment appraisal.", type: "info" };
}

/**
 * Celebration messages for each section completion
 */
export const celebrationMessages: Record<string, string> = {
  personnel_costs: "Excellent! Team structure defined. Now let's look at operating costs.",
  operating_expenses: "Great! Operating expenses captured. Now for capital investments.",
  capital_investments: "Perfect! Infrastructure planned. Time to project revenues.",
  revenue_forecasts: "Fantastic! Revenue projections complete. Now for financial analysis.",
  financial_analysis: "Excellent! Key metrics calculated. Final risk assessment now.",
  risk_assessment: "Complete! Your investment appraisal is ready for review.",
};

/**
 * Get initial message for a section when it becomes active
 */
export function getSectionStartMessage(sectionId: string): string {
  const messages: Record<string, string> = {
    personnel_costs: "Let's start with your team structure. What roles do you need and what are the expected salaries?",
    operating_expenses: "Now let's look at operating expenses. What are your monthly running costs?",
    capital_investments: "What capital investments are needed? Equipment, infrastructure, etc.",
    revenue_forecasts: "Time to project revenues. What's your pricing model and growth expectations?",
    financial_analysis: "Let me calculate ROI, NPV, IRR and other key financial metrics.",
    risk_assessment: "Finally, let's assess the viability and risks of this investment.",
  };
  return messages[sectionId] || "Let's continue...";
}
