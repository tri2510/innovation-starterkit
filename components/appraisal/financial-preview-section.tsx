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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuickFinancialPreview } from '@/types/innovation';
import { cn } from '@/lib/utils';
import { getSession, saveSession } from '@/lib/session';

interface FinancialPreviewSectionProps {
  ideaId: string;
  ideaName: string;
  ideaDescription: string;
  marketAnalysis: any;
  challenge: any;
  existingPreview?: QuickFinancialPreview;
  onPreviewUpdate?: (preview: QuickFinancialPreview) => void;
}

export function FinancialPreviewSection({
  ideaId,
  ideaName,
  ideaDescription,
  marketAnalysis,
  challenge,
  existingPreview,
  onPreviewUpdate,
}: FinancialPreviewSectionProps) {
  const [preview, setPreview] = useState<QuickFinancialPreview | null>(existingPreview || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRadar, setShowRadar] = useState(true);

  useEffect(() => {
    // Only fetch if we don't have existing preview
    if (!existingPreview && !preview) {
      fetchFinancialPreview();
    } else if (existingPreview && !preview) {
      // Use the cached preview
      setPreview(existingPreview);
    }
  }, [ideaId, existingPreview]);

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
          <div className="h-7 w-7 rounded-md bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <BarChart3 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-semibold">Financial Projections & Innovation Radar</span>
          {preview && (
            <Badge variant="outline" className="text-xs">
              {preview.fiveYearCumulativeROI}% ROI
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {preview && !isLoading && (
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
                <p className="text-sm text-muted-foreground">Generating financial projections...</p>
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
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                          <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: '#6b7280', fontSize: 10 }}
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
                  preview.gate1Status === 'met' && preview.gate2Status === 'met'
                    ? "border-green-200 dark:border-green-800"
                    : "border-orange-200 dark:border-orange-800"
                )}>
                  <h4 className="text-sm font-bold mb-3">Financial Summary</h4>
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
                        <p className="text-[10px] text-muted-foreground italic">{preview.assumptions}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Database Comparison */}
              <Card className="p-3">
                <h4 className="text-sm font-bold mb-3">Database Comparison</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(preview.databaseComparison).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize font-medium">{formatLabel(key)}</span>
                        <Badge
                          variant={value.rating === 'above-average' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {value.percentile}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              value.rating === 'above-average'
                                ? 'bg-green-500'
                                : value.rating === 'below-average'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                            )}
                            style={{ width: `${value.yourScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium w-10 text-right">{value.yourScore}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">DB avg: {value.databaseAverage}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    marketFit: 'Market Fit',
    innovation: 'Innovation',
    financialViability: 'Financial Viability',
    strategicFit: 'Strategic Fit',
    riskLevel: 'Risk Level',
    marketSize: 'Market Size',
  };
  return labels[key] || key;
}
