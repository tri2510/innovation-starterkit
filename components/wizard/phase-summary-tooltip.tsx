"use client";

import { Challenge, MarketAnalysis, BusinessIdea, InnovationSession } from "@/types/innovation";
import { Target, TrendingUp, Lightbulb, DollarSign, Presentation, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

interface PhaseSummaryTooltipProps {
  phase: "challenge" | "market" | "ideation" | "investment-appraisal" | "pitch";
  session: InnovationSession | null;
  children: React.ReactNode;
}

/**
 * PhaseSummaryTooltip - Shows a summary of completed phase data on hover
 *
 * Displays key information from each completed phase in a clean, readable format.
 */
export function PhaseSummaryTooltip({ phase, session, children }: PhaseSummaryTooltipProps) {
  const [isClient, setIsClient] = useState(false);
  const [summary, setSummary] = useState<ReturnType<typeof getChallengeSummary> | null>(null);

  // Set isClient on mount and calculate summary
  useEffect(() => {
    setIsClient(true);
    setSummary(getPhaseSummary());
  }, [session, phase]);

  const getPhaseSummary = () => {
    if (!session) return null;

    switch (phase) {
      case "challenge":
        return getChallengeSummary(session.challenge);
      case "market":
        return getMarketSummary(session.marketAnalysis);
      case "ideation":
        return getIdeationSummary(session.ideas, session.selectedIdeaId);
      case "investment-appraisal":
        return getAppraisalSummary(session.ideas, session.selectedIdeaId);
      case "pitch":
        return getPitchSummary(session.pitchDeck);
      default:
        return null;
    }
  };

  // Always render the same structure - only show tooltip content when summary exists
  return (
    <div className="group relative inline-block w-full">
      {children}
      {/* Tooltip - positioned below to avoid overflow at top of page */}
      {summary && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
          <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-xl p-4 text-sm">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-700 dark:border-neutral-300">
              {summary.icon}
              <span className="font-semibold">{summary.title}</span>
              <CheckCircle2 className="h-4 w-4 text-green-400 dark:text-green-600 ml-auto" />
            </div>
            {/* Content */}
            <div className="space-y-2">
              {summary.content}
            </div>
          </div>
          {/* Arrow - pointing up */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-neutral-900 dark:border-b-neutral-100" />
        </div>
      )}
    </div>
  );
}

interface Summary {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

function getChallengeSummary(challenge?: Challenge): Summary | null {
  if (!challenge || !challenge.problem) return null;

  return {
    icon: <Target className="h-4 w-4 text-blue-400 dark:text-blue-600" />,
    title: "Challenge",
    content: (
      <>
        <div>
          <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Problem</span>
          <p className="line-clamp-2 text-neutral-100 dark:text-neutral-800">{challenge.problem}</p>
        </div>
        <div>
          <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Target</span>
          <p className="line-clamp-1 text-neutral-100 dark:text-neutral-800">{challenge.targetAudience}</p>
        </div>
        {challenge.industry && (
          <div>
            <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Industry</span>
            <p className="text-neutral-100 dark:text-neutral-800">{challenge.industry}</p>
          </div>
        )}
      </>
    ),
  };
}

function getMarketSummary(market?: MarketAnalysis): Summary | null {
  if (!market || !market.tam) return null;

  return {
    icon: <TrendingUp className="h-4 w-4 text-green-400 dark:text-green-600" />,
    title: "Market Analysis",
    content: (
      <>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center p-2 bg-neutral-800 dark:bg-neutral-200 rounded">
            <span className="text-neutral-400 dark:text-neutral-600 text-xs block">TAM</span>
            <span className="font-semibold text-neutral-100 dark:text-neutral-800">{market.tam}</span>
          </div>
          <div className="text-center p-2 bg-neutral-800 dark:bg-neutral-200 rounded">
            <span className="text-neutral-400 dark:text-neutral-600 text-xs block">SAM</span>
            <span className="font-semibold text-neutral-100 dark:text-neutral-800">{market.sam}</span>
          </div>
          <div className="text-center p-2 bg-neutral-800 dark:bg-neutral-200 rounded">
            <span className="text-neutral-400 dark:text-neutral-600 text-xs block">SOM</span>
            <span className="font-semibold text-neutral-100 dark:text-neutral-800">{market.som}</span>
          </div>
        </div>
        {market.trends && market.trends.length > 0 && (
          <div>
            <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Trends</span>
            <p className="line-clamp-2 text-neutral-100 dark:text-neutral-800">
              {market.trends.slice(0, 2).map((t) => t.name).join(", ")}
              {market.trends.length > 2 && "..."}
            </p>
          </div>
        )}
      </>
    ),
  };
}

function getIdeationSummary(ideas?: BusinessIdea[], selectedIdeaId?: string): Summary | null {
  if (!ideas || ideas.length === 0) return null;

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId) || ideas[0];

  return {
    icon: <Lightbulb className="h-4 w-4 text-yellow-400 dark:text-yellow-600" />,
    title: "Ideas Generated",
    content: (
      <>
        <div className="flex justify-between items-center mb-2">
          <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Total Ideas</span>
          <span className="font-semibold text-neutral-100 dark:text-neutral-800">{ideas.length}</span>
        </div>
        {selectedIdea && (
          <div>
            <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Selected</span>
            <p className="font-medium text-neutral-100 dark:text-neutral-800">{selectedIdea.name}</p>
            <p className="line-clamp-2 text-xs text-neutral-300 dark:text-neutral-700">{selectedIdea.tagline}</p>
          </div>
        )}
      </>
    ),
  };
}

function getAppraisalSummary(ideas?: BusinessIdea[], selectedIdeaId?: string): Summary | null {
  if (!ideas || ideas.length === 0) return null;

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId) || ideas[0];

  // Check if appraisal fields are populated
  if (!selectedIdea?.estimatedInvestment) return null;

  // Type guard for detailed metrics
  const hasDetailedMetrics = selectedIdea.metrics && 'overallScore' in selectedIdea.metrics;
  const overallScore = hasDetailedMetrics ? (selectedIdea.metrics as any).overallScore : undefined;

  return {
    icon: <DollarSign className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />,
    title: "Investment Appraisal",
    content: (
      <>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Investment</span>
            <p className="font-semibold text-neutral-100 dark:text-neutral-800">{selectedIdea.estimatedInvestment}</p>
          </div>
          {selectedIdea.timeframe && (
            <div>
              <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Timeline</span>
              <p className="font-semibold text-neutral-100 dark:text-neutral-800">{selectedIdea.timeframe}</p>
            </div>
          )}
        </div>
        {selectedIdea.businessModel && (
          <div>
            <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Business Model</span>
            <p className="line-clamp-2 text-xs text-neutral-100 dark:text-neutral-800">{selectedIdea.businessModel}</p>
          </div>
        )}
        {overallScore && (
          <div className="mt-2 pt-2 border-t border-neutral-700 dark:border-neutral-300">
            <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Overall Score</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-700 dark:bg-neutral-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                  style={{ width: `${overallScore}%` }}
                />
              </div>
              <span className="font-bold text-neutral-100 dark:text-neutral-800">{overallScore}</span>
            </div>
          </div>
        )}
      </>
    ),
  };
}

function getPitchSummary(pitchDeck?: any): Summary | null {
  if (!pitchDeck || !pitchDeck.slides || pitchDeck.slides.length === 0) return null;

  return {
    icon: <Presentation className="h-4 w-4 text-purple-400 dark:text-purple-600" />,
    title: "Pitch Deck",
    content: (
      <>
        <div className="flex justify-between items-center mb-2">
          <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Slides</span>
          <span className="font-semibold text-neutral-100 dark:text-neutral-800">{pitchDeck.slides.length}</span>
        </div>
        {pitchDeck.title && (
          <div>
            <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Title</span>
            <p className="line-clamp-1 text-neutral-100 dark:text-neutral-800">{pitchDeck.title}</p>
          </div>
        )}
        <div className="mt-2">
          <span className="text-neutral-400 dark:text-neutral-600 text-xs uppercase">Slide Types</span>
          <p className="line-clamp-1 text-xs text-neutral-100 dark:text-neutral-800">
            {pitchDeck.slides.slice(0, 4).map((s: any) => s.title || s.type).join(", ")}
            {pitchDeck.slides.length > 4 && "..."}
          </p>
        </div>
      </>
    ),
  };
}
