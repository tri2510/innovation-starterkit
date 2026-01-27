'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Target,
  TrendingUp,
  DollarSign,
  Award,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  BusinessIdea,
  QuickFinancialPreview,
  MarketAnalysis,
  Challenge,
} from '@/types/innovation';
import { cn } from '@/lib/utils';

interface IdeaSelectionPanelProps {
  idea: BusinessIdea;
  marketAnalysis: MarketAnalysis;
  challenge: Challenge;
  onClose: () => void;
  onSelectIdea: () => void;
}

export function IdeaSelectionPanel({
  idea,
  marketAnalysis,
  challenge,
  onClose,
  onSelectIdea,
}: IdeaSelectionPanelProps) {
  const [preview, setPreview] = useState<QuickFinancialPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(true);
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(true);

  useEffect(() => {
    fetchFinancialPreview();
  }, [idea]);

  const fetchFinancialPreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/quick-financial-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          marketAnalysis,
          challenge,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setPreview(data.data);
    } catch (err) {
      console.error('Error fetching financial preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare radar chart data
  const radarData = preview
    ? [
        { metric: 'Market Fit', yourScore: preview.radarScores.marketFit, fullMark: 100 },
        { metric: 'Innovation', yourScore: preview.radarScores.innovation, fullMark: 100 },
        {
          metric: 'Financial',
          yourScore: preview.radarScores.financialViability,
          fullMark: 100,
        },
        { metric: 'Strategic', yourScore: preview.radarScores.strategicFit, fullMark: 100 },
        { metric: 'Risk Adj.', yourScore: preview.radarScores.riskLevel, fullMark: 100 },
        { metric: 'Market Size', yourScore: preview.radarScores.marketSize, fullMark: 100 },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{idea.name}</h2>
              <p className="text-sm text-muted-foreground italic">&quot;{idea.tagline}&quot;</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Idea Description */}
          <Card className="p-4 mb-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
            <p className="text-sm leading-relaxed">{idea.description}</p>
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">
                Problem Solved
              </p>
              <p className="text-sm text-purple-900 dark:text-purple-100 mt-1">
                {idea.problemSolved}
              </p>
            </div>
          </Card>

          {isLoading ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Sparkles className="h-12 w-12 text-purple-400 animate-pulse mb-4" />
                <p className="text-lg font-medium mb-2">Analyzing your idea...</p>
                <p className="text-sm text-muted-foreground text-center">
                  Generating financial projections and comparing with innovation database
                </p>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-8 border-red-200 bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Failed to load preview</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </Card>
          ) : preview ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Radar Chart */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Innovation Radar
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    vs Database
                  </Badge>
                </div>

                <div className="aspect-square max-w-[350px] mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: '#9ca3af', fontSize: 9 }}
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

                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Comparison against {idea.searchFields?.industries?.[0] || 'industry'} database
                  </p>
                </div>
              </Card>

              {/* Right: Financial Preview */}
              <div className="space-y-4">
                {/* Financial Quick View */}
                <Card className={cn(
                  "border-2",
                  preview.gate1Status === 'met' && preview.gate2Status === 'met'
                    ? "border-green-200 dark:border-green-800"
                    : "border-orange-200 dark:border-orange-800"
                )}>
                  <div
                    className="px-4 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                    onClick={() => setIsFinancialExpanded(!isFinancialExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold">Financial Quick View</span>
                    </div>
                    {isFinancialExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>

                  {isFinancialExpanded && (
                    <div className="p-4 space-y-3">
                      {/* ROI */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">5-Year ROI</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {preview.fiveYearCumulativeROI}%
                        </span>
                      </div>

                      {/* Break-even */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">Break-even</span>
                        </div>
                        <span className="text-lg font-bold text-purple-600">
                          Year {preview.breakEvenYear}
                        </span>
                      </div>

                      {/* Investment */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Investment</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {preview.totalInvestment}
                        </span>
                      </div>

                      {/* Year 5 Revenue */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-600" />
                          <span className="text-sm">Year 5 Revenue</span>
                        </div>
                        <span className="text-lg font-bold text-amber-600">
                          {preview.year5Revenue}
                        </span>
                      </div>

                      {/* Investment Gates */}
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Gate 1 (Break-even ≤ 3yr)</span>
                          {preview.gate1Status === 'met' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Gate 2 (5-Year ROI ≥ 150%)</span>
                          {preview.gate2Status === 'met' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>

                      {preview.assumptions && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground">{preview.assumptions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Database Comparison */}
                <Card>
                  <div
                    className="px-4 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                    onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold">Database Comparison</span>
                    </div>
                    {isComparisonExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>

                  {isComparisonExpanded && (
                    <div className="p-4 space-y-3">
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
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  value.rating === 'above-average'
                                    ? 'bg-green-500'
                                    : value.rating === 'below-average'
                                    ? 'bg-orange-500'
                                    : 'bg-blue-500'
                                )}
                                style={{ width: `${value.yourScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-16 text-right">
                              {value.yourScore}%
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            DB avg: {value.databaseAverage}%
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Back to Ideas
          </Button>
          <Button
            onClick={onSelectIdea}
            className="gap-2"
            disabled={!preview || isLoading}
          >
            Select This Idea
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
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
