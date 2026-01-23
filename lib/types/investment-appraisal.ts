import { z } from 'zod';

// Personnel Level Schema
export const PersonnelLevelSchema = z.object({
  level: z.number(),
  count2025: z.number().default(0),
  count2026: z.number().default(0),
  count2027: z.number().default(0),
  count2028: z.number().default(0),
  count2029: z.number().default(0),
  count2030: z.number().default(0),
});

// Personnel Cost Schema
export const PersonnelCostSchema = z.object({
  levels: z.array(PersonnelLevelSchema),
  totalCost2025: z.number().default(0),
  totalCost2026: z.number().default(0),
  totalCost2027: z.number().default(0),
  totalCost2028: z.number().default(0),
  totalCost2029: z.number().default(0),
  totalCost2030: z.number().default(0),
});

// Opex Category Schema
export const OpexCategorySchema = z.object({
  category: z.string(),
  amount2025: z.number().default(0),
  amount2026: z.number().default(0),
  amount2027: z.number().default(0),
  amount2028: z.number().default(0),
  amount2029: z.number().default(0),
  amount2030: z.number().default(0),
});

// Operating Expenses Schema
export const OperatingExpensesSchema = z.object({
  travel: OpexCategorySchema,
  revenueHardware: OpexCategorySchema,
  training: OpexCategorySchema,
  softwareCI: OpexCategorySchema,
  others: OpexCategorySchema,
  seminarsWorkshops: OpexCategorySchema,
  marketingSales: OpexCategorySchema,
  buildingFacilities: OpexCategorySchema,
  itfm: OpexCategorySchema,
  ci: OpexCategorySchema,
});

// Capital Expenditure Schema
export const CapexInvestmentSchema = z.object({
  year: z.number(),
  investment: z.number().default(0),
  depreciation: z.number().default(0),
});

// Revenue Forecast Schema
export const RevenueForecastSchema = z.object({
  year: z.number(),
  amount: z.number().default(0),
});

// Profit & Loss Schema
export const ProfitLossSchema = z.object({
  revenues: z.array(z.number()),
  personnelCosts: z.array(z.number()),
  totalDirectCosts: z.array(z.number()),
  grossMargins: z.array(z.number()),
  ebitda: z.array(z.number()),
  ebit: z.array(z.number()),
  cumulativeROI: z.array(z.number()),
  roiPercentage: z.array(z.number()),
});

// Complete Investment Appraisal Schema
export const InvestmentAppraisalSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  
  // Basic Info
  projectName: z.string().min(1, "Project name is required"),
  projectCode: z.string().optional(),
  
  // Financial Projections (5-year)
  personnelCosts: PersonnelCostSchema,
  operatingExpenses: OperatingExpensesSchema,
  capexInvestments: z.array(CapexInvestmentSchema),
  revenueForecasts: z.array(RevenueForecastSchema),
  
  // Calculated P&L
  profitLoss: ProfitLossSchema,
  
  // Strategic Metrics
  paybackPeriod: z.number().optional(),
  netPresentValue: z.number().optional(),
  internalRateOfReturn: z.number().optional(),
  
  // Assessment
  riskLevel: z.enum(['low', 'medium', 'high']),
  viabilityScore: z.number().min(0).max(100),
  recommendation: z.string(),
  
  // Metadata
  assumptions: z.array(z.string()).optional(),
  sensitivityAnalysis: z.record(z.string(), z.array(z.number())).optional(),
});

// AI Chat Progress Schema for Appraisal
export const AppraisalProgressSchema = z.object({
  currentSection: z.enum([
    'intro',
    'personnel_costs', 
    'operating_expenses',
    'capital_investments',
    'revenue_forecasts',
    'financial_analysis',
    'risk_assessment',
    'complete'
  ]),
  completedSections: z.array(z.string()),
  totalSections: z.number().default(6),
  progressPercentage: z.number().min(0).max(100),
});

export type InvestmentAppraisal = z.infer<typeof InvestmentAppraisalSchema>;
export type AppraisalProgress = z.infer<typeof AppraisalProgressSchema>;
export type PersonnelLevel = z.infer<typeof PersonnelLevelSchema>;
export type OpexCategory = z.infer<typeof OpexCategorySchema>;