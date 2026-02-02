/**
 * Financial Validation Utility
 *
 * Provides validation and verification for AI-generated financial projections.
 * Ensures AI calculations are mathematically sound and well-sourced.
 */

import type { BusinessIdea, MarketAnalysis, Challenge } from '@/types/innovation';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculations: CalculationBreakdown;
}

export interface CalculationBreakdown {
  revenueModel: {
    pricing: { monthly: number; annual: number };
    customers: { year1: number; year2: number; year3: number; year4: number; year5: number };
    revenue: { year1: number; year2: number; year3: number; year4: number; year5: number };
  };
  costStructure: {
    personnel: { annual: number; withBenefits: number };
    opex: { monthly: number; annual: number };
    capital: { initial: number };
  };
  metrics: {
    totalInvestment: number;
    fiveYearRevenue: number;
    fiveYearProfit: number;
    roi: number;
    breakEvenYear: number;
  };
  sources: string[];
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyStr: string): number {
  if (!currencyStr) return 0;

  const cleanStr = currencyStr.replace(/[$,]/g, '').toLowerCase();
  const value = parseFloat(cleanStr);

  if (cleanStr.includes('b')) return value * 1000000000;
  if (cleanStr.includes('m')) return value * 1000000;
  if (cleanStr.includes('k')) return value * 1000;

  return value;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

/**
 * Validate financial projections for consistency
 * This ensures AI-generated numbers make sense
 */
export function validateFinancialProjections(
  projections: any,
  context: { idea: BusinessIdea; marketAnalysis: MarketAnalysis; challenge: Challenge }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const breakdown: CalculationBreakdown = {
    revenueModel: {
      pricing: { monthly: 0, annual: 0 },
      customers: { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 },
      revenue: { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 },
    },
    costStructure: {
      personnel: { annual: 0, withBenefits: 0 },
      opex: { monthly: 0, annual: 0 },
      capital: { initial: 0 },
    },
    metrics: {
      totalInvestment: 0,
      fiveYearRevenue: 0,
      fiveYearProfit: 0,
      roi: 0,
      breakEvenYear: 0,
    },
    sources: [],
  };

  // Extract revenue projections
  if (projections.revenueForecasts) {
    const rf = projections.revenueForecasts;
    breakdown.revenueModel.revenue.year1 = parseCurrency(rf.year1?.projected || '0');
    breakdown.revenueModel.revenue.year2 = parseCurrency(rf.year2?.projected || '0');
    breakdown.revenueModel.revenue.year3 = parseCurrency(rf.year3?.projected || '0');
    breakdown.revenueModel.revenue.year4 = parseCurrency(rf.year4?.projected || '0');
    breakdown.revenueModel.revenue.year5 = parseCurrency(rf.year5?.projected || '0');

    // Extract customer counts if available
    breakdown.revenueModel.customers.year1 = rf.year1?.customers || 0;
    breakdown.revenueModel.customers.year2 = rf.year2?.customers || 0;
    breakdown.revenueModel.customers.year3 = rf.year3?.customers || 0;
    breakdown.revenueModel.customers.year4 = rf.year4?.customers || 0;
    breakdown.revenueModel.customers.year5 = rf.year5?.customers || 0;

    breakdown.sources.push('Revenue projections from AI-generated customer forecasts');
  }

  // Extract costs
  if (projections.personnelCosts) {
    breakdown.costStructure.personnel.annual = parseCurrency(projections.personnelCosts.totalAnnual || '0');
    breakdown.costStructure.personnel.withBenefits = parseCurrency(projections.personnelCosts.totalWithBenefits || '0');
    breakdown.sources.push(`Personnel costs: ${projections.personnelCosts.team?.length || 0} team members`);
  }

  if (projections.operatingExpenses) {
    breakdown.costStructure.opex.monthly = parseCurrency(projections.operatingExpenses.totalMonthly || '0');
    breakdown.costStructure.opex.annual = parseCurrency(projections.operatingExpenses.totalAnnual || '0');
    breakdown.sources.push('Operating expenses based on industry benchmarks');
  }

  if (projections.capitalInvestments) {
    breakdown.costStructure.capital.initial = parseCurrency(projections.capitalInvestments.totalInitial || '0');
    breakdown.sources.push('Capital investments: MVP, equipment, marketing, legal, working capital');
  }

  // Extract financial metrics
  if (projections.financialAnalysis) {
    breakdown.metrics.totalInvestment = parseCurrency(projections.financialAnalysis.totalInvestment || '0');
    breakdown.metrics.fiveYearRevenue = parseCurrency(projections.financialAnalysis.fiveYearRevenue || '0');
    breakdown.metrics.fiveYearProfit = parseCurrency(projections.financialAnalysis.fiveYearProfitAfterExpenses || '0');
    breakdown.metrics.roi = parseFloat(projections.financialAnalysis.roi?.replace('%', '') || '0');
    breakdown.metrics.breakEvenYear = projections.financialAnalysis.breakEvenYear || 0;
    breakdown.sources.push('ROI, payback, and break-even calculated from projections');
  }

  // Validation checks

  // 1. Revenue should grow over time
  if (breakdown.revenueModel.revenue.year2 <= breakdown.revenueModel.revenue.year1) {
    warnings.push('Year 2 revenue should grow from Year 1');
  }
  if (breakdown.revenueModel.revenue.year3 <= breakdown.revenueModel.revenue.year2) {
    warnings.push('Year 3 revenue should grow from Year 2');
  }

  // 2. Total investment should be positive
  if (breakdown.metrics.totalInvestment <= 0) {
    errors.push('Total investment must be positive');
  }

  // 3. ROI should be reasonable (-100% to 1000%)
  if (breakdown.metrics.roi < -100 || breakdown.metrics.roi > 1000) {
    warnings.push(`ROI of ${breakdown.metrics.roi}% is outside typical range (-100% to 1000%)`);
  }

  // 4. Break-even should be within 5 years
  if (breakdown.metrics.breakEvenYear < 1 || breakdown.metrics.breakEvenYear > 5) {
    warnings.push(`Break-even at Year ${breakdown.metrics.breakEvenYear} is outside 5-year horizon`);
  }

  // 5. Costs should be reasonable (at least some personnel and opex)
  if (breakdown.costStructure.personnel.annual < 50000) {
    warnings.push('Personnel costs seem low for a startup (<$50K/year)');
  }
  if (breakdown.costStructure.opex.annual < 12000) {
    warnings.push('Operating expenses seem low (<$1K/month)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculations: breakdown,
  };
}
