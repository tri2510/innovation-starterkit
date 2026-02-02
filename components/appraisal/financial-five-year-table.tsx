'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  DollarSign,
  BarChart3,
  Sparkles,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export interface FiveYearFinancialData {
  years: {
    year: string;
    revenue: number;
    revenueGrowth?: number;
    capex: number;
    investorCapex: number;
    selfFundedCapex: number;
    opex: number;
    investorOpex: number;
    selfFundedOpex: number;
    opexPercentRevenue: number;
    ebitda: number;
    depreciation: number;
    ebit: number;
  }[];
  investmentMetrics: {
    investment: number;
    revenue: number;
    ebit: number;
    cumulativeRoi: number;
  }[];
  totals: {
    revenue: number;
    capex: number;
    investorCapex: number;
    selfFundedCapex: number;
    opex: number;
    investorOpex: number;
    selfFundedOpex: number;
    ebitda: number;
    ebit: number;
  };
  gates: {
    breakEvenYear?: number;
    breakEvenMonth?: number;
    fiveYearRoiTarget: number; // 150
    fiveYearRoiActual: number;
  };
}

interface FinancialFiveYearTableProps {
  data: FiveYearFinancialData;
  financialAnalysis?: {
    roi: string;
    npv: string;
    irr: string;
    paybackPeriod: string;
  };
  radarScores?: {
    marketFit: number;
    innovation: number;
    financialViability: number;
    strategicFit: number;
    riskLevel: number;
    marketSize: number;
  };
}

export function FinancialFiveYearTable({ data, financialAnalysis, radarScores }: FinancialFiveYearTableProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Prepare radar chart data
  const radarData = radarScores
    ? [
        { metric: 'Market Fit', yourScore: radarScores.marketFit, fullMark: 100 },
        { metric: 'Innovation', yourScore: radarScores.innovation, fullMark: 100 },
        { metric: 'Financial', yourScore: radarScores.financialViability, fullMark: 100 },
        { metric: 'Strategic', yourScore: radarScores.strategicFit, fullMark: 100 },
        { metric: 'Risk Adj.', yourScore: radarScores.riskLevel, fullMark: 100 },
        { metric: 'Market Size', yourScore: radarScores.marketSize, fullMark: 100 },
      ]
    : [];

  // Format number with parentheses for negative values
  const formatNumber = (num: number, decimals = 2) => {
    if (num < 0) {
      return `(${Math.abs(num).toFixed(decimals)})`;
    }
    return num.toFixed(decimals);
  };

  // Format percentage
  const formatPercent = (num: number) => {
    if (num < 0) {
      return `(${Math.abs(num).toFixed(1)}%)`;
    }
    return `${num.toFixed(1)}%`;
  };

  // Format radar metric labels
  const formatLabel = (metric: string): string => {
    const labelMap: Record<string, string> = {
      'Market Fit': 'Market Fit',
      'Innovation': 'Innovation',
      'Financial': 'Financial',
      'Strategic': 'Strategic',
      'Risk Adj.': 'Risk Level',
      'Market Size': 'Market Size',
    };
    return labelMap[metric] || metric;
  };

  // Check gate status
  const gate1Met = data.gates.breakEvenYear && data.gates.breakEvenYear <= 3;
  const gate2Met = data.gates.fiveYearRoiActual >= data.gates.fiveYearRoiTarget;

  return (
    <Card className="border-2 overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold">5-Year Financial Model</h3>
          <Badge variant="outline" className="text-[10px]">
            {data.years[0].year}–{data.years[data.years.length - 1].year}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Gate Status Indicators */}
          <div className="flex items-center gap-1">
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium',
                gate1Met
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              )}
            >
              {gate1Met ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              Gate 1: BE ≤3y
            </div>
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium',
                gate2Met
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              )}
            >
              {gate2Met ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              Gate 2: ROI ≥150%
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Gate Explanations */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-blue-900 dark:text-blue-100 space-y-1">
              <p>
                <strong>Gate 1:</strong> Break-even point must fall within 3 years{' '}
                {data.gates.breakEvenYear && (
                  <span className="text-blue-700 dark:text-blue-300">
                    (Actual: {data.gates.breakEvenYear}y {data.gates.breakEvenMonth}m)
                  </span>
                )}
              </p>
              <p>
                <strong>Gate 2:</strong> Cumulative ROI (EBIT-based) after 5 years must reach 150%{' '}
                <span className="text-blue-700 dark:text-blue-300">
                  (Actual: {formatPercent(data.gates.fiveYearRoiActual)})
                </span>
              </p>
            </div>
          </div>

          {/* Innovation Radar | Financial Summary - Side by Side */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Innovation Radar */}
            {radarScores && radarData.length > 0 && (
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold">Innovation Radar</h4>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#6b7280', fontSize: 9 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: '#9ca3af', fontSize: 8 }}
                      />
                      <Radar
                        name="Your Idea"
                        dataKey="yourScore"
                        stroke="#9333ea"
                        fill="#9333ea"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  {/* Legend with scores */}
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                    {radarData.map((item) => (
                      <div key={item.metric} className="flex items-center justify-between text-[9px]">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatLabel(item.metric)}:</span>
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">{item.yourScore}/100</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Financial Summary Card */}
            {financialAnalysis && (
              <Card className="p-3 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold">Financial Summary</h4>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>From appraisal data</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {/* ROI */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs">5-Year ROI</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{financialAnalysis.roi}</span>
                  </div>

                  {/* NPV */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs">NPV</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{financialAnalysis.npv}</span>
                  </div>

                  {/* IRR */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs">IRR</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{financialAnalysis.irr}</span>
                  </div>

                  {/* Payback */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-orange-600" />
                      <span className="text-xs">Payback Period</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">{financialAnalysis.paybackPeriod}</span>
                  </div>

                  {/* Investment Gates */}
                  <div className="pt-2 border-t space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Gate 1: Break-even ≤ 3yr</span>
                      {gate1Met ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Gate 2: 5-Year ROI ≥ 150%</span>
                      {gate2Met ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Divider */}
          <div className="border-t"></div>

          {/* Main Financial Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-semibold border">Metric</th>
                  {data.years.map((year) => (
                    <th key={year.year} className="text-center p-2 font-semibold border min-w-[70px]">
                      {year.year}
                    </th>
                  ))}
                  <th className="text-center p-2 font-semibold border min-w-[80px] bg-neutral-100 dark:bg-neutral-800">
                    Total {data.years[0].year}–{data.years[data.years.length - 1].year}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue Section */}
                <tr className="bg-yellow-50/50 dark:bg-yellow-950/20">
                  <td className="p-2 font-medium border">Revenue</td>
                  {data.years.map((year) => (
                    <td key={year.year} className="text-center p-2 border">
                      {formatNumber(year.revenue)}
                    </td>
                  ))}
                  <td className="text-center p-2 border font-semibold bg-yellow-50 dark:bg-yellow-950/30">
                    {formatNumber(data.totals.revenue)}
                  </td>
                </tr>
                {showDetails && (
                  <tr className="text-muted-foreground">
                    <td className="p-2 pl-4 border italic">YoY Growth</td>
                    {data.years.map((year) => (
                      <td key={year.year} className="text-center p-2 border">
                        {year.revenueGrowth !== undefined ? formatPercent(year.revenueGrowth) : '—'}
                      </td>
                    ))}
                    <td className="text-center p-2 border">—</td>
                  </tr>
                )}

                {/* Capex Section */}
                <tr className="bg-yellow-50/50 dark:bg-yellow-950/20">
                  <td className="p-2 font-medium border">Capex – Total</td>
                  {data.years.map((year) => (
                    <td key={year.year} className="text-center p-2 border">
                      {formatNumber(year.capex)}
                    </td>
                  ))}
                  <td className="text-center p-2 border font-semibold bg-yellow-50 dark:bg-yellow-950/30">
                    {formatNumber(data.totals.capex)}
                  </td>
                </tr>
                {showDetails && (
                  <>
                    <tr className="text-muted-foreground">
                      <td className="p-2 pl-4 border italic">Cash in from investors</td>
                      {data.years.map((year) => (
                        <td key={year.year} className="text-center p-2 border">
                          {formatNumber(year.investorCapex)}
                        </td>
                      ))}
                      <td className="text-center p-2 border">
                        {formatNumber(data.totals.investorCapex)}
                      </td>
                    </tr>
                    <tr className="text-muted-foreground">
                      <td className="p-2 pl-4 border italic">Self-funded from operations</td>
                      {data.years.map((year) => (
                        <td key={year.year} className="text-center p-2 border">
                          {formatNumber(year.selfFundedCapex)}
                        </td>
                      ))}
                      <td className="text-center p-2 border">
                        {formatNumber(data.totals.selfFundedCapex)}
                      </td>
                    </tr>
                  </>
                )}

                {/* Opex Section */}
                <tr className="bg-yellow-50/50 dark:bg-yellow-950/20">
                  <td className="p-2 font-medium border">Opex (all operating costs)</td>
                  {data.years.map((year) => (
                    <td key={year.year} className="text-center p-2 border">
                      {formatNumber(year.opex)}
                    </td>
                  ))}
                  <td className="text-center p-2 border font-semibold bg-yellow-50 dark:bg-yellow-950/30">
                    {formatNumber(data.totals.opex)}
                  </td>
                </tr>
                {showDetails && (
                  <>
                    <tr className="text-muted-foreground">
                      <td className="p-2 pl-4 border italic">Cash in from investors</td>
                      {data.years.map((year) => (
                        <td key={year.year} className="text-center p-2 border">
                          {formatNumber(year.investorOpex)}
                        </td>
                      ))}
                      <td className="text-center p-2 border">
                        {formatNumber(data.totals.investorOpex)}
                      </td>
                    </tr>
                    <tr className="text-muted-foreground">
                      <td className="p-2 pl-4 border italic">Self-funded from operations</td>
                      {data.years.map((year) => (
                        <td key={year.year} className="text-center p-2 border">
                          {formatNumber(year.selfFundedOpex)}
                        </td>
                      ))}
                      <td className="text-center p-2 border">
                        {formatNumber(data.totals.selfFundedOpex)}
                      </td>
                    </tr>
                    <tr className="text-muted-foreground">
                      <td className="p-2 pl-4 border italic">Opex % of revenue</td>
                      {data.years.map((year) => (
                        <td key={year.year} className="text-center p-2 border">
                          {formatPercent(year.opexPercentRevenue)}
                        </td>
                      ))}
                      <td className="text-center p-2 border">—</td>
                    </tr>
                  </>
                )}

                {/* Profitability Section */}
                <tr>
                  <td className="p-2 font-medium border">EBITDA</td>
                  {data.years.map((year) => (
                    <td
                      key={year.year}
                      className={cn(
                        'text-center p-2 border',
                        year.ebitda < 0 ? 'text-red-600' : 'text-green-600'
                      )}
                    >
                      {formatNumber(year.ebitda)}
                    </td>
                  ))}
                  <td
                    className={cn(
                      'text-center p-2 border',
                      data.totals.ebitda < 0 ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {formatNumber(data.totals.ebitda)}
                  </td>
                </tr>

                <tr className="text-muted-foreground">
                  <td className="p-2 pl-4 border italic">Depreciation (3 years)</td>
                  {data.years.map((year) => (
                    <td key={year.year} className="text-center p-2 border">
                      {formatNumber(year.depreciation)}
                    </td>
                  ))}
                  <td className="text-center p-2 border">—</td>
                </tr>

                <tr className="bg-neutral-50 dark:bg-neutral-900">
                  <td className="p-2 font-semibold border">EBIT</td>
                  {data.years.map((year) => (
                    <td
                      key={year.year}
                      className={cn(
                        'text-center p-2 border font-medium',
                        year.ebit < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'
                      )}
                    >
                      {formatNumber(year.ebit)}
                    </td>
                  ))}
                  <td
                    className={cn(
                      'text-center p-2 border font-bold',
                      data.totals.ebit < 0 ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {formatNumber(data.totals.ebit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Investment Analysis Table */}
          {data.investmentMetrics && data.investmentMetrics.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Investment Performance
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 font-semibold border">Metric</th>
                      {data.years.map((year) => (
                        <th key={year.year} className="text-center p-2 font-semibold border min-w-[70px]">
                          {year.year}
                        </th>
                      ))}
                      <th className="text-center p-2 font-semibold border min-w-[80px] bg-neutral-100 dark:bg-neutral-800">
                        Sum
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Investment */}
                    <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                      <td className="p-2 font-medium border">Investment</td>
                      {data.investmentMetrics.map((metric, idx) => (
                        <td key={idx} className="text-center p-2 border">
                          {formatNumber(metric.investment)}
                        </td>
                      ))}
                      <td className="text-center p-2 border font-semibold bg-blue-50 dark:bg-blue-950/30">
                        {formatNumber(data.investmentMetrics.reduce((sum, m) => sum + m.investment, 0))}
                      </td>
                    </tr>

                    {/* Revenue */}
                    <tr>
                      <td className="p-2 font-medium border">Revenue</td>
                      {data.investmentMetrics.map((metric, idx) => (
                        <td key={idx} className="text-center p-2 border">
                          {formatNumber(metric.revenue)}
                        </td>
                      ))}
                      <td className="text-center p-2 border font-semibold">
                        {formatNumber(data.investmentMetrics.reduce((sum, m) => sum + m.revenue, 0))}
                      </td>
                    </tr>

                    {/* EBIT */}
                    <tr>
                      <td className="p-2 font-medium border">EBIT</td>
                      {data.investmentMetrics.map((metric, idx) => (
                        <td
                          key={idx}
                          className={cn(
                            'text-center p-2 border',
                            metric.ebit < 0 ? 'text-red-600' : 'text-green-600'
                          )}
                        >
                          {formatNumber(metric.ebit)}
                        </td>
                      ))}
                      <td
                        className={cn(
                          'text-center p-2 border font-semibold',
                          data.investmentMetrics.reduce((sum, m) => sum + m.ebit, 0) < 0 ? 'text-red-600' : 'text-green-600'
                        )}
                      >
                        {formatNumber(data.investmentMetrics.reduce((sum, m) => sum + m.ebit, 0))}
                      </td>
                    </tr>

                    {/* Cum. ROI (EBIT based) */}
                    <tr className="bg-green-50/50 dark:bg-green-950/20">
                      <td className="p-2 font-medium border">Cum. ROI (EBIT based)</td>
                      {data.investmentMetrics.map((metric, idx) => (
                        <td
                          key={idx}
                          className={cn(
                            'text-center p-2 border font-medium',
                            metric.cumulativeRoi < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'
                          )}
                        >
                          {formatPercent(metric.cumulativeRoi)}
                        </td>
                      ))}
                      <td className="text-center p-2 border">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Toggle Details Button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[10px] h-7"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Detailed Breakdown
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Detailed Breakdown
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// Helper function to parse existing appraisal data into FiveYearFinancialData format
export function parseFiveYearDataFromAppraisal(appraisal: any): {
  data: FiveYearFinancialData;
  financialAnalysis?: {
    roi: string;
    npv: string;
    irr: string;
    paybackPeriod: string;
  };
  radarScores?: {
    marketFit: number;
    innovation: number;
    financialViability: number;
    strategicFit: number;
    riskLevel: number;
    marketSize: number;
  };
} | null {
  if (!appraisal.revenueForecasts || !appraisal.financialAnalysis) {
    return null;
  }

  const rf = appraisal.revenueForecasts;
  const fa = appraisal.financialAnalysis;

  // Helper to parse currency string to number
  const parseCurrency = (str: string): number => {
    if (!str) return 0;
    const cleaned = str.toString().replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
  };

  // Helper to parse percentage string to number
  const parsePercent = (str: string): number => {
    if (!str) return 0;
    const cleaned = str.toString().replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
  };

  // Extract year data from appraisal
  const years = [rf.year1, rf.year2, rf.year3, rf.year4, rf.year5]
    .filter((year): year is NonNullable<typeof year> => year != null)
    .map((yearData, idx) => {
      const yearLabel = `${2026 + idx}`;
      const revenue = parseCurrency(yearData.projected);
      const growth = yearData.growth ? parsePercent(yearData.growth) : 0;

      // Parse detailed financial data if available (new format)
      const capex = yearData.capex ? parseCurrency(yearData.capex.total) : parseCurrency(yearData.capexTotal || '0');
      const investorCapex = yearData.capex ? parseCurrency(yearData.capex.investorFunded) : 0;
      const selfFundedCapex = yearData.capex ? parseCurrency(yearData.capex.selfFunded) : 0;

      const opex = yearData.opex ? parseCurrency(yearData.opex.total) : parseCurrency(yearData.opexTotal || '0');
      const investorOpex = yearData.opex ? parseCurrency(yearData.opex.investorFunded) : 0;
      const selfFundedOpex = yearData.opex ? parseCurrency(yearData.opex.selfFunded) : 0;
      const opexPercentRevenue = yearData.opex ? parsePercent(yearData.opex.percentOfRevenue) : 0;

      const ebitda = yearData.ebitda ? parseCurrency(yearData.ebitda) : 0;
      const depreciation = yearData.depreciation ? parseCurrency(yearData.depreciation) : 0;
      const ebit = yearData.ebit ? parseCurrency(yearData.ebit) : 0;

      return {
        year: yearLabel,
        revenue: revenue / 1000000, // Convert to millions
        revenueGrowth: growth,
        capex: capex / 1000000,
        investorCapex: investorCapex / 1000000,
        selfFundedCapex: selfFundedCapex / 1000000,
        opex: opex / 1000000,
        investorOpex: investorOpex / 1000000,
        selfFundedOpex: selfFundedOpex / 1000000,
        opexPercentRevenue,
        ebitda: ebitda / 1000000,
        depreciation: depreciation / 1000000,
        ebit: ebit / 1000000,
      };
    });

  // Calculate totals
  const totals = {
    revenue: years.reduce((sum, y) => sum + y.revenue, 0),
    capex: years.reduce((sum, y) => sum + y.capex, 0),
    investorCapex: years.reduce((sum, y) => sum + y.investorCapex, 0),
    selfFundedCapex: years.reduce((sum, y) => sum + y.selfFundedCapex, 0),
    opex: years.reduce((sum, y) => sum + y.opex, 0),
    investorOpex: years.reduce((sum, y) => sum + y.investorOpex, 0),
    selfFundedOpex: years.reduce((sum, y) => sum + y.selfFundedOpex, 0),
    ebitda: years.reduce((sum, y) => sum + y.ebitda, 0),
    ebit: years.reduce((sum, y) => sum + y.ebit, 0),
  };

  // Calculate investment metrics and cumulative ROI
  const totalInvestment = parseCurrency(fa.totalInvestment);
  const annualInvestment = totalInvestment / 5;

  const investmentMetrics = years.map((year, idx) => {
    const cumulativeEbit = years.slice(0, idx + 1).reduce((sum, y) => sum + y.ebit, 0);
    const cumulativeInvestment = (idx + 1) * (annualInvestment / 1000000);
    const cumulativeRoi = cumulativeInvestment > 0 ? (cumulativeEbit / cumulativeInvestment) * 100 : 0;

    return {
      investment: annualInvestment / 1000000,
      revenue: year.revenue,
      ebit: year.ebit,
      cumulativeRoi,
    };
  });

  // Parse break-even
  const beMatch = fa.breakEvenPoint?.match(/Month (\d+)/);
  const breakEvenMonth = beMatch ? parseInt(beMatch[1]) : undefined;
  const breakEvenYear = breakEvenMonth ? Math.ceil(breakEvenMonth / 12) : undefined;

  // Parse ROI
  const roiMatch = fa.roi?.match(/(\d+)%/);
  const fiveYearRoiActual = roiMatch ? parseInt(roiMatch[1]) : 0;

  // Extract financial analysis for quick summary cards
  const financialAnalysis = {
    roi: fa.roi || 'N/A',
    npv: fa.npv || 'N/A',
    irr: fa.irr || 'N/A',
    paybackPeriod: fa.paybackPeriod || 'N/A',
  };

  // Extract radar scores from appraisal metrics
  const radarScores = appraisal.metrics ? {
    marketFit: appraisal.metrics.marketFit?.score || 70,
    innovation: appraisal.metrics.innovation?.score || 70,
    financialViability: appraisal.metrics.financialViability?.score || 70,
    strategicFit: appraisal.metrics.strategicFit?.score || 70,
    riskLevel: appraisal.riskAssessment?.riskLevel === 'low' ? 80 :
                appraisal.riskAssessment?.riskLevel === 'medium' ? 60 : 40,
    marketSize: appraisal.metrics.marketSize?.score || 70,
  } : undefined;

  return {
    data: {
      years,
      investmentMetrics,
      totals,
      gates: {
        breakEvenYear,
        breakEvenMonth,
        fiveYearRoiTarget: 150,
        fiveYearRoiActual,
      },
    },
    financialAnalysis,
    radarScores,
  };
}
