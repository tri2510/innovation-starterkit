'use client';

import { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Award,
  CheckCircle2,
  XCircle,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuickFinancialPreview } from '@/types/innovation';
import { cn } from '@/lib/utils';
import { getSession, saveSession } from '@/lib/session';
import { parseAssumptions, extractKeyMetrics } from '@/lib/financial-formatter';
import type { Industry } from '@/types/innovation';
import { FinancialFiveYearTable, parseFiveYearDataFromAppraisal, type FiveYearFinancialData } from './financial-five-year-table';

// Component to display formatted financial assumptions
function FinancialAssumptionsDisplay({ assumptions }: { assumptions: string }) {
  const keyMetrics = extractKeyMetrics(assumptions);

  // If we can extract key metrics, show them in a structured way
  if (keyMetrics.pricing || keyMetrics.year1Customers) {
    return (
      <div className="space-y-1.5">
        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {keyMetrics.pricing && (
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Pricing</span>
              <span className="text-[9px] font-medium">{keyMetrics.pricing}</span>
            </div>
          )}
          {keyMetrics.year1Customers && (
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Year 1</span>
              <span className="text-[9px] font-medium">{keyMetrics.year1Customers} cust</span>
            </div>
          )}
          {keyMetrics.year5Customers && (
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Year 5</span>
              <span className="text-[9px] font-medium">{keyMetrics.year5Customers} cust</span>
            </div>
          )}
          {keyMetrics.growthRate && (
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Growth</span>
              <span className="text-[9px] font-medium">{keyMetrics.growthRate}</span>
            </div>
          )}
        </div>

        {/* Full details - expandable */}
        <details className="group">
          <summary className="text-[9px] text-blue-600 cursor-pointer hover:underline list-none">
            View detailed calculation
          </summary>
          <div className="mt-1.5 p-2 bg-muted/50 rounded text-[9px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {assumptions}
          </div>
        </details>
      </div>
    );
  }

  // Fallback: show raw text with better formatting
  return (
    <div className="space-y-1.5">
      <details className="group">
        <summary className="text-[9px] text-blue-600 cursor-pointer hover:underline list-none">
          View calculation details
        </summary>
        <div className="mt-1.5 p-2 bg-muted/50 rounded text-[9px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {assumptions}
        </div>
      </details>
    </div>
  );
}

interface FinancialPreviewSectionProps {
  ideaId: string;
  ideaName: string;
  ideaDescription: string;
  marketAnalysis: any;
  challenge: any;
  appraisalData?: any; // Full appraisal data - takes precedence
  existingPreview?: QuickFinancialPreview;
  onPreviewUpdate?: (preview: QuickFinancialPreview) => void;
}

export function FinancialPreviewSection({
  ideaId,
  ideaName,
  ideaDescription,
  marketAnalysis,
  challenge,
  appraisalData, // NEW: Full appraisal data
  existingPreview,
  onPreviewUpdate,
}: FinancialPreviewSectionProps) {
  const [preview, setPreview] = useState<QuickFinancialPreview | null>(existingPreview || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRadar, setShowRadar] = useState(true);

  // Derive preview from appraisalData when available (ensures consistency)
  useEffect(() => {
    if (appraisalData) {
      // Derive preview from full appraisal data
      const derivedPreview = derivePreviewFromAppraisal(appraisalData);
      setPreview(derivedPreview);
    } else if (existingPreview) {
      // Use cached preview if no appraisal data yet
      setPreview(existingPreview);
    } else {
      // No data - waiting for appraisal
      setPreview(null);
    }
  }, [appraisalData, existingPreview]);

  // Only fetch quick preview if we have no appraisal data and no existing preview
  useEffect(() => {
    if (!appraisalData && !existingPreview && !preview) {
      fetchFinancialPreview();
    }
  }, [ideaId, appraisalData]);

  // Helper to derive preview from appraisal data
  function derivePreviewFromAppraisal(appraisal: any): QuickFinancialPreview | null {
    if (!appraisal.financialAnalysis) return null;

    const fa = appraisal.financialAnalysis;

    // Parse ROI from appraisal
    const roiMatch = fa.roi?.match(/(\d+)%/);
    const fiveYearCumulativeROI = roiMatch ? parseInt(roiMatch[1]) : 0;

    // Parse break-even
    const beMatch = fa.breakEvenPoint?.match(/(\d+)/);
    const breakEvenYear = beMatch ? Math.ceil(parseInt(beMatch[1]) / 12) : 3;

    // Derive radar scores from appraisal metrics
    const radarScores = appraisal.metrics ? {
      marketFit: appraisal.metrics.marketFit?.score || 70,
      innovation: appraisal.metrics.innovation?.score || 70,
      financialViability: appraisal.metrics.financialViability?.score || 70,
      strategicFit: appraisal.metrics.strategicFit?.score || 70,
      riskLevel: appraisal.riskAssessment?.riskLevel === 'low' ? 80 :
                  appraisal.riskAssessment?.riskLevel === 'medium' ? 60 : 40,
      marketSize: appraisal.metrics.marketSize?.score || 70,
    } : preview?.radarScores || {
      marketFit: 70, innovation: 70, financialViability: 70,
      strategicFit: 70, riskLevel: 65, marketSize: 70,
    };

    // Build assumptions from appraisal data
    const assumptions = buildAssumptionsFromAppraisal(appraisal);

    // Gate status
    const gate1Status = breakEvenYear <= 3 ? 'met' : 'not-met';
    const gate2Status = fiveYearCumulativeROI >= 150 ? 'met' : 'not-met';

    return {
      fiveYearCumulativeROI,
      breakEvenYear,
      totalInvestment: fa.totalInvestment || 'N/A',
      year5Revenue: appraisal.revenueForecasts?.year5?.projected || 'N/A',
      assumptions,
      radarScores,
      gate1Status,
      gate2Status,
    };
  }

  function buildAssumptionsFromAppraisal(appraisal: any): string {
    const parts: string[] = [];

    if (appraisal.revenueForecasts) {
      const rf = appraisal.revenueForecasts;
      parts.push('REVENUE FORECASTS:');

      if (rf.year1) parts.push(`Year 1: ${rf.year1.projected} (${rf.year1.assumptions?.substring(0, 60) || 'Initial market entry'}...)`);
      if (rf.year5) parts.push(`Year 5: ${rf.year5.projected} (${rf.year5.assumptions?.substring(0, 60) || 'Mature market'}...)`);
    }

    if (appraisal.financialAnalysis) {
      const fa = appraisal.financialAnalysis;
      parts.push('\nFINANCIAL METRICS:');
      parts.push(`Total Investment: ${fa.totalInvestment}`);
      parts.push(`5-Year Revenue: ${fa.fiveYearRevenue}`);
      parts.push(`ROI: ${fa.roi}`);
      parts.push(`Break-even: ${fa.breakEvenPoint}`);
    }

    if (appraisal.metrics) {
      parts.push('\nRADAR SCORES:');
      if (appraisal.metrics.marketFit) parts.push(`Market Fit (${appraisal.metrics.marketFit.score}/100): ${appraisal.metrics.marketFit.feedback?.substring(0, 80)}...`);
      if (appraisal.metrics.financialViability) parts.push(`Financial Viability (${appraisal.metrics.financialViability.score}/100): ${appraisal.metrics.financialViability.feedback?.substring(0, 80)}...`);
    }

    return parts.join('\n');
  }

  const fetchFinancialPreview = async (regenerate = false) => {
    if (regenerate) setIsRegenerating(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/quick-financial-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: {
            id: ideaId,
            name: ideaName,
            description: ideaDescription,
          },
          marketAnalysis,
          challenge,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setPreview(data.data);

      // Save the preview to the idea in the session for persistence
      const session = getSession();
      if (session && session.ideas) {
        const ideaIndex = session.ideas.findIndex((i: any) => i.id === ideaId);
        if (ideaIndex !== -1) {
          session.ideas[ideaIndex].financialPreview = data.data;
          saveSession(session);
        }
      }

      if (onPreviewUpdate) {
        onPreviewUpdate(data.data);
      }
    } catch (err) {
      console.error('Error fetching financial preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  // Prepare radar chart data
  const radarData = preview
    ? [
        { metric: 'Market Fit', yourScore: preview.radarScores.marketFit, fullMark: 100 },
        { metric: 'Innovation', yourScore: preview.radarScores.innovation, fullMark: 100 },
        { metric: 'Financial', yourScore: preview.radarScores.financialViability, fullMark: 100 },
        { metric: 'Strategic', yourScore: preview.radarScores.strategicFit, fullMark: 100 },
        { metric: 'Risk Adj.', yourScore: preview.radarScores.riskLevel, fullMark: 100 },
        { metric: 'Market Size', yourScore: preview.radarScores.marketSize, fullMark: 100 },
      ]
    : [];

  return (
    <Card className="border-2">
      <div
        className="px-4 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center",
            appraisalData ? "bg-blue-100 dark:bg-blue-900/50" : "bg-green-100 dark:bg-green-900/50"
          )}>
            <BarChart3 className={cn(
              "h-3.5 w-3.5",
              appraisalData ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"
            )} />
          </div>
          <span className="text-sm font-semibold">
            {appraisalData ? "Financial Summary & Innovation Radar" : "Financial Projections & Innovation Radar"}
          </span>
          {preview && (
            <Badge variant="outline" className="text-xs">
              {preview.fiveYearCumulativeROI}% ROI
            </Badge>
          )}
          <Badge variant={appraisalData ? "default" : "secondary"} className="text-xs">
            {appraisalData ? "From Appraisal" : "Quick Preview"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {!appraisalData && preview && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                fetchFinancialPreview(true);
              }}
              disabled={isRegenerating}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")} />
              <span className="text-xs ml-1">Recalculate</span>
            </Button>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {appraisalData ? "Loading appraisal data..." : "Generating financial projections..."}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                <BarChart3 className="h-4 w-4" />
                <p>{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fetchFinancialPreview()}
              >
                Try Again
              </Button>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {/* Top Section: Radar Chart + Financial Metrics */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Radar Chart */}
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold">Innovation Radar</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowRadar(!showRadar)}
                    >
                      {showRadar ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  {showRadar && (
                    <div className="aspect-square max-w-[280px] mx-auto">
                      <style jsx>{`
                        .dark .recharts-polar-grid {
                          stroke: #4b5563 !important;
                        }
                        .dark .recharts-polar-angle-axis text,
                        .dark .recharts-polar-radius-axis text {
                          fill: #94a3b8 !important;
                        }
                        .dark .recharts-radar .recharts-tooltip-cursor {
                          fill: #1e293b !important;
                          stroke: #9333ea !important;
                        }
                        .dark .recharts-layer.recharts-polar-grid {
                          stroke: #4b5563 !important;
                        }
                      `}</style>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e5e7eb" strokeWidth={1} className="dark:stroke-slate-600" />
                          <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            className="dark:fill-slate-400"
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: '#9ca3af', fontSize: 8 }}
                            className="dark:fill-slate-300"
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
                    </div>
                  )}
                  {!showRadar && (
                    <div className="aspect-square max-w-[280px] mx-auto flex items-center justify-center">
                      <p className="text-xs text-muted-foreground text-center">Click "Show" to display radar chart</p>
                    </div>
                  )}
                </Card>

                {/* Financial Metrics */}
                <Card className={cn(
                  "p-3 border-2",
                  appraisalData ? "border-blue-200 dark:border-blue-800" : null,
                  !appraisalData && preview.gate1Status === 'met' && preview.gate2Status === 'met'
                    ? "border-green-200 dark:border-green-800"
                    : !appraisalData ? "border-orange-200 dark:border-orange-800"
                    : null
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold">Financial Summary</h4>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>{appraisalData ? "From full appraisal" : "AI-generated with transparent sources"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {/* ROI */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-xs">5-Year ROI</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{preview.fiveYearCumulativeROI}%</span>
                    </div>

                    {/* Break-even */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                        <span className="text-xs">Break-even</span>
                      </div>
                      <span className="text-sm font-bold text-purple-600">Year {preview.breakEvenYear}</span>
                    </div>

                    {/* Investment */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs">Investment</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{preview.totalInvestment}</span>
                    </div>

                    {/* Year 5 Revenue */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-xs">Year 5 Revenue</span>
                      </div>
                      <span className="text-sm font-bold text-amber-600">{preview.year5Revenue}</span>
                    </div>

                    {/* Investment Gates */}
                    <div className="pt-2 border-t space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Gate 1: Break-even ≤ 3yr</span>
                        {preview.gate1Status === 'met' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Gate 2: 5-Year ROI ≥ 150%</span>
                        {preview.gate2Status === 'met' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                        )}
                      </div>
                    </div>

                    {preview.assumptions && (
                      <div className="pt-2 border-t">
                        <div className="flex items-start gap-1.5">
                          <Info className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <FinancialAssumptionsDisplay assumptions={preview.assumptions} />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>


              {/* 5-Year Financial Model Table */}
              {(() => {
                // Only show table if we have full appraisal data with financial forecasts
                if (appraisalData?.financialAnalysis && (appraisalData.personnelCosts || appraisalData.operatingExpenses || appraisalData.capitalInvestments || appraisalData.revenueForecasts)) {
                  const parsedData = parseFiveYearDataFromAppraisal(appraisalData);
                  if (parsedData) {
                    return (
                      <FinancialFiveYearTable
                        data={parsedData.data}
                        financialAnalysis={parsedData.financialAnalysis}
                        radarScores={parsedData.radarScores}
                      />
                    );
                  }
                }
                return null;
              })()}
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
