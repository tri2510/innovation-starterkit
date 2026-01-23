"use client";

import { useState } from "react";
import { TrendingUp, Target, Zap, DollarSign, Award, BarChart3, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DetailedIdeaMetrics, IdeaMetrics } from "@/types/innovation";

interface ScoreBreakdownProps {
  metrics: DetailedIdeaMetrics | IdeaMetrics;
  compact?: boolean; // Compact view for cards
  detailed?: boolean; // Show full details with feedback
}

// Type guard to check if metrics is DetailedIdeaMetrics
function isDetailedMetrics(metrics: DetailedIdeaMetrics | IdeaMetrics): metrics is DetailedIdeaMetrics {
  return "overallScore" in metrics && "problemClarity" in metrics;
}

// Criterion display configuration
const CRITERIA_CONFIG = [
  { key: "problemClarity", label: "Problem Clarity", icon: Target, color: "blue", weight: 35 },
  { key: "marketSize", label: "Market Size", icon: BarChart3, color: "green", weight: 10 },
  { key: "innovation", label: "Innovation", icon: Zap, color: "purple", weight: 10 },
  { key: "financialViability", label: "Financial Viability", icon: DollarSign, color: "emerald", weight: 15 },
  { key: "strategicFit", label: "Strategic Fit", icon: Award, color: "amber", weight: 5 },
  { key: "marketFit", label: "Market Fit", icon: TrendingUp, color: "indigo", weight: 25 },
] as const;

const getColorClasses = (score: number, colorBase: string) => {
  const colorMap: Record<string, { high: string; medium: string; low: string }> = {
    blue: { high: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300", medium: "bg-blue-50 dark:bg-blue-950/30 text-blue-600", low: "bg-blue-50 dark:bg-blue-950/30 text-blue-500" },
    green: { high: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300", medium: "bg-green-50 dark:bg-green-950/30 text-green-600", low: "bg-green-50 dark:bg-green-950/30 text-green-500" },
    purple: { high: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300", medium: "bg-purple-50 dark:bg-purple-950/30 text-purple-600", low: "bg-purple-50 dark:bg-purple-950/30 text-purple-500" },
    emerald: { high: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300", medium: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600", low: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" },
    amber: { high: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300", medium: "bg-amber-50 dark:bg-amber-950/30 text-amber-600", low: "bg-amber-50 dark:bg-amber-950/30 text-amber-500" },
    indigo: { high: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300", medium: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600", low: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500" },
  };

  const colors = colorMap[colorBase] || colorMap.blue;
  if (score >= 70) return colors.high;
  if (score >= 40) return colors.medium;
  return colors.low;
};

const getScoreTextColor = (score: number) => {
  if (score >= 70) return "text-green-600 dark:text-green-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

export function ScoreBreakdown({ metrics, compact = false, detailed = false }: ScoreBreakdownProps) {
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);

  // Handle legacy metrics format
  if (!isDetailedMetrics(metrics)) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Fit", value: metrics.marketFit, icon: TrendingUp, color: "green" },
          { label: "Doable", value: metrics.feasibility, icon: Target, color: "yellow" },
          { label: "New", value: metrics.innovation, icon: Zap, color: "blue" },
        ].map((metric) => (
          <div key={metric.label} className="p-2 rounded bg-stone-50 dark:bg-stone-950/50">
            <p className="text-[8px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase">{metric.label}</p>
            <p className={`text-sm font-bold ${getScoreTextColor(metric.value)}`}>{metric.value}%</p>
          </div>
        ))}
      </div>
    );
  }

  // Detailed metrics display
  if (compact) {
    // Compact view: Show overall score + top 3 weighted criteria
    const topCriteria = [...CRITERIA_CONFIG]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);

    return (
      <div className="space-y-2">
        {/* Overall Score */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Overall Score</span>
          <span className={`text-lg font-bold ${getScoreTextColor(metrics.overallScore)}`}>{metrics.overallScore}</span>
        </div>

        {/* Top 3 Criteria */}
        <div className="grid grid-cols-3 gap-1.5">
          {topCriteria.map((criterion) => {
            const Icon = criterion.icon;
            const score = metrics[criterion.key].score;
            const bgClass = getColorClasses(score, criterion.color);

            return (
              <TooltipProvider key={criterion.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`p-1.5 rounded ${bgClass} text-center cursor-help`}>
                      <Icon className="h-3 w-3 mx-auto mb-0.5 opacity-70" />
                      <p className="text-[10px] font-bold">{score}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <div className="text-xs">
                      <p className="font-semibold">{criterion.label} ({criterion.weight}%)</p>
                      <p className="text-muted-foreground mt-1">{metrics[criterion.key].feedback}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    );
  }

  // Detailed view: Show all criteria with expandable feedback
  return (
    <div className="space-y-3">
      {/* Overall Score Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Overall Score</span>
        <Badge variant="outline" className={`${getScoreTextColor(metrics.overallScore)} border-2`}>
          <span className="text-lg font-bold">{metrics.overallScore}</span>
          <span className="text-xs ml-1">/100</span>
        </Badge>
      </div>

      {/* All Criteria with Feedback */}
      <div className="space-y-2">
        {CRITERIA_CONFIG.map((criterion) => {
          const Icon = criterion.icon;
          const criterionData = metrics[criterion.key];
          const score = criterionData.score;
          const bgClass = getColorClasses(score, criterion.color);
          const isExpanded = expandedCriterion === criterion.key;

          return (
            <div key={criterion.key} className={`border rounded-lg overflow-hidden ${isExpanded ? "border-primary/50" : "border-border"}`}>
              <button
                onClick={() => setExpandedCriterion(isExpanded ? null : criterion.key)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-md ${bgClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{criterion.label}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {criterion.weight}%
                      </Badge>
                    </div>
                    <p className={`text-lg font-bold ${getScoreTextColor(score)}`}>{score}/100</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 pt-0 border-t bg-muted/20">
                  <div className="flex items-start gap-2 mt-3">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {criterionData.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
