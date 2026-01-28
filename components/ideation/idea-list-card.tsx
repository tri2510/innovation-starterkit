'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BusinessIdea } from '@/types/innovation';

interface IdeaListCardProps {
  idea: BusinessIdea;
  isSelected: boolean;
  isConfirmed: boolean;
  onClick: () => void;
  onConfirm: (e: React.MouseEvent) => void;
}

export function IdeaListCard({ idea, isSelected, isConfirmed, onClick, onConfirm }: IdeaListCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 dark:text-green-300';
    if (score >= 60) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-red-700 dark:text-red-300';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const getScoreProgress = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const uniquenessScore = Math.round(idea.metrics?.uniqueness || 70);
  const feasibilityScore = Math.round(idea.metrics?.feasibility || 70);

  const getUniquenessColor = () => getScoreColor(uniquenessScore);
  const getUniquenessBg = () => getScoreBg(uniquenessScore);
  const getUniquenessProgress = () => getScoreProgress(uniquenessScore);

  const getFeasibilityColor = () => getScoreColor(feasibilityScore);
  const getFeasibilityBg = () => getScoreBg(feasibilityScore);
  const getFeasibilityProgress = () => getScoreProgress(feasibilityScore);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all overflow-hidden border relative group",
        "hover:shadow-md",
        // LinkedIn-style selected state
        isSelected
          ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm"
          : "border-neutral-200 dark:border-neutral-800 hover:border-purple-300"
      )}
      onClick={onClick}
    >
      {/* Selection Indicator - Left border bar */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
      )}

      {/* Card Content */}
      <div className="p-4">
        {/* Header with Select Button */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-sm font-bold leading-tight mb-1",
              isSelected ? "text-purple-900 dark:text-purple-100" : "text-neutral-900 dark:text-neutral-100"
            )}>
              {idea.name}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
              {idea.tagline}
            </p>
          </div>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className={cn(
              "flex-shrink-0 transition-all hover:scale-110",
              "h-7 w-7 rounded-full flex items-center justify-center"
            )}
            title={isConfirmed ? "Selected" : "Select this idea"}
          >
            {isConfirmed ? (
              <div className="h-7 w-7 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            ) : (
              <div className={cn(
                "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm",
                isSelected
                  ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30"
                  : "border-neutral-300 bg-white hover:border-purple-500"
              )}>
                {isSelected && (
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                )}
              </div>
            )}
          </button>
        </div>

        {/* Description - LinkedIn style compact */}
        <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 line-clamp-2 mb-3">
          {idea.description}
        </p>

        {/* Metrics Preview */}
        {idea.metrics && (
          <div className="space-y-2">
            {/* Uniqueness & Feasibility */}
            <div className="grid grid-cols-2 gap-2">
              {/* Uniqueness */}
              <div className={cn("p-2 rounded-md border", getUniquenessBg())}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Unique
                  </span>
                  <span className={cn("text-xs font-bold", getUniquenessColor())}>
                    {uniquenessScore}
                  </span>
                </div>
                <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", getUniquenessProgress())}
                    style={{ width: `${uniquenessScore}%` }}
                  />
                </div>
              </div>

              {/* Feasibility */}
              <div className={cn("p-2 rounded-md border", getFeasibilityBg())}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" />
                    Feasible
                  </span>
                  <span className={cn("text-xs font-bold", getFeasibilityColor())}>
                    {feasibilityScore}
                  </span>
                </div>
                <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", getFeasibilityProgress())}
                    style={{ width: `${feasibilityScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategic Focus - Compact */}
        {idea.searchFields && idea.searchFields.industries && idea.searchFields.industries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-wrap gap-1">
              {idea.searchFields.industries.slice(0, 2).map((industry, index) => (
                <Badge key={`ind-${index}`} variant="outline" className="text-[10px] px-1.5 py-0">
                  {industry}
                </Badge>
              ))}
              {idea.searchFields.technologies && idea.searchFields.technologies.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {idea.searchFields.technologies[0]}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
