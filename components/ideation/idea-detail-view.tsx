'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Briefcase, Cpu, BarChart3, ChevronDown, ChevronUp, Info, Sparkles, Zap, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { BusinessIdea, MarketAnalysis } from '@/types/innovation';

interface IdeaDetailViewProps {
  idea: BusinessIdea | null;
  marketAnalysis: MarketAnalysis;
  allIdeas?: BusinessIdea[];
  onClose?: () => void;
  onSelect?: (ideaId: string) => void;
  onGenerateScores?: (ideaId: string, scoreAll?: boolean) => void;
  isScoring?: boolean;
  isScoringAll?: boolean;
  selectedIdeaId?: string | null;
  hasUnscoredIdeas?: boolean;
}

interface UniquenessAnalysis {
  score: number;
  factors: {
    technology: { score: number; description: string };
    businessModel: { score: number; description: string };
    marketApproach: { score: number; description: string };
    solutionNovelty: { score: number; description: string };
  };
  comparison: {
    moreUnique: string[];
    similarTo: string[];
  };
  insights: string[];
}

interface FeasibilityAnalysis {
  score: number;
  factors: {
    technicalComplexity: { score: number; description: string; challenge: string };
    resourceRequirements: { score: number; description: string; needs: string };
    timeline: { score: number; description: string; estimatedTime: string };
    riskLevel: { score: number; description: string };
  };
  strengths: string[];
  challenges: string[];
  recommendations: string[];
}

export function IdeaDetailView({ idea, marketAnalysis, allIdeas = [], onClose, onSelect, onGenerateScores, isScoring = false, isScoringAll = false, selectedIdeaId, hasUnscoredIdeas = false }: IdeaDetailViewProps) {
  const [isUniquenessExpanded, setIsUniquenessExpanded] = useState(true);
  const [isFeasibilityExpanded, setIsFeasibilityExpanded] = useState(true);
  const [isEvaluationExpanded, setIsEvaluationExpanded] = useState(true);

  // Generate analysis data based on idea metrics - only if metrics exist
  const uniquenessAnalysis: UniquenessAnalysis | null = idea && idea.metrics ? {
    score: idea.metrics.uniqueness,
    factors: {
      technology: {
        score: Math.min(100, Math.max(0, Math.round(idea.metrics.uniqueness + (Math.random() * 10 - 5)))),
        description: idea.searchFields?.technologies?.join(', ') || 'General technology',
      },
      businessModel: {
        score: Math.min(100, Math.max(0, Math.round(idea.metrics.uniqueness + (Math.random() * 10 - 5)))),
        description: 'Novel approach to value creation and customer capture',
      },
      marketApproach: {
        score: Math.min(100, Math.max(0, Math.round(idea.metrics.uniqueness + (Math.random() * 10 - 5)))),
        description: `Targeting ${marketAnalysis?.som || 'specific market segment'}`,
      },
      solutionNovelty: {
        score: Math.min(100, Math.max(0, Math.round(idea.metrics.uniqueness + (Math.random() * 10 - 5)))),
        description: 'Innovative solution to the identified problem',
      },
    },
    comparison: {
      moreUnique: allIdeas
        .filter(i => i.id !== idea.id && i.metrics?.uniqueness && idea.metrics && i.metrics.uniqueness < idea.metrics.uniqueness)
        .sort((a, b) => (a.metrics?.uniqueness || 0) - (b.metrics?.uniqueness || 0))
        .slice(0, 2)
        .map(i => i.name),
      similarTo: allIdeas
        .filter(i => i.id !== idea.id && i.metrics?.uniqueness && idea.metrics && i.metrics.uniqueness >= idea.metrics.uniqueness - 10)
        .sort((a, b) => (b.metrics?.uniqueness || 0) - (a.metrics?.uniqueness || 0))
        .slice(0, 2)
        .map(i => i.name),
    },
    insights: [
      idea.metrics.uniqueness > 80
        ? 'Highly unique approach with strong differentiation potential'
        : idea.metrics.uniqueness > 60
        ? 'Moderately unique with some distinct elements'
        : 'Similar to existing solutions, consider further innovation',
      `Uses ${idea.searchFields?.technologies?.join(', ') || 'available'} technologies`,
      `Addresses problem: ${idea.problemSolved.substring(0, 80)}...`,
    ],
  } : null;

  const feasibilityAnalysis: FeasibilityAnalysis | null = idea && idea.metrics ? {
    score: idea.metrics.feasibility,
    factors: {
      technicalComplexity: {
        score: Math.min(100, Math.max(0, Math.round(idea.metrics.feasibility + (Math.random() * 10 - 5)))),
        description: 'Technical implementation complexity',
        challenge: idea.metrics.feasibility < 70 ? 'Requires advanced R&D and specialized expertise' : 'Proven technology stack',
      },
      resourceRequirements: {
        score: Math.min(100, Math.max(0, Math.round(idea.metrics.feasibility + (Math.random() * 10 - 5)))),
        description: 'Capital and human resource needs',
        needs: idea.metrics.feasibility < 70 ? 'Significant investment in skilled personnel and infrastructure' : 'Standard resource requirements',
      },
      timeline: {
        score: Math.min(100, Math.max(0, Math.round(idea.metrics.feasibility + (Math.random() * 10 - 5)))),
        description: 'Time to develop and launch',
        estimatedTime: idea.metrics.feasibility > 80 ? '6-12 months to MVP' : idea.metrics.feasibility > 60 ? '12-18 months' : '18-24 months',
      },
      riskLevel: {
        score: Math.min(100, Math.max(0, Math.round(idea.metrics.feasibility + (Math.random() * 10 - 5)))),
        description: 'Overall execution risk',
      },
    },
    strengths: idea.evaluation?.strengths || [
      idea.metrics.feasibility > 70 ? 'Clear problem-solution fit' : 'Challenging but addressable',
      idea.metrics.feasibility > 60 ? 'Market opportunity exists' : 'Requires market validation',
      idea.searchFields?.industries?.map(i => `Aligns with ${i} industry trends`).join(', ') || 'Industry relevant',
    ].filter(Boolean),
    challenges: idea.evaluation?.weaknesses || [
      idea.metrics.feasibility < 80 ? 'Technical implementation challenges' : 'Standard development risks',
      idea.metrics.feasibility < 70 ? 'Resource-intensive' : 'Requires careful resource planning',
      idea.metrics.feasibility < 60 ? 'Extended timeline to market' : 'Moderate development timeline',
    ].filter(Boolean),
    recommendations: idea.evaluation?.criticalQuestions || [
      idea.metrics.feasibility > 80 ? 'Ready for immediate development' : 'Consider technical proof-of-concept',
      idea.metrics.feasibility > 60 ? 'Start with core features, expand over time' : 'Phased approach recommended',
      'Validate with target customers early',
      'Build cross-functional team with relevant expertise',
    ],
  } : null;

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

  const getUniquenessColor = () => getScoreColor(uniquenessAnalysis?.score || 70);
  const getUniquenessBg = () => getScoreBg(uniquenessAnalysis?.score || 70);
  const getUniquenessProgress = () => getScoreProgress(uniquenessAnalysis?.score || 70);

  const getFeasibilityColor = () => getScoreColor(feasibilityAnalysis?.score || 70);
  const getFeasibilityBg = () => getScoreBg(feasibilityAnalysis?.score || 70);
  const getFeasibilityProgress = () => getScoreProgress(feasibilityAnalysis?.score || 70);

  if (!idea) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="inline-flex p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
          <Lightbulb className="h-10 w-10 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Select an Idea
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
          Click on an idea from the left sidebar to view detailed analysis, metrics, and evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {idea.name}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {idea.tagline}
            </p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 hidden lg:flex"
              title="Close detail view"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Overview Card */}
        <Card className="border-2">
          <div className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Description
              </h3>
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {idea.description}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Problem Solved
                </h4>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {idea.problemSolved}
                </p>
              </div>
            </div>

            {idea.searchFields && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Strategic Focus Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {idea.searchFields.industries?.map((industry, index) => (
                    <Badge key={`ind-${index}`} variant="outline" className="text-xs">
                      {industry}
                    </Badge>
                  ))}
                  {idea.searchFields.technologies?.map((tech, index) => (
                    <Badge key={`tech-${index}`} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Generate Scores Card - Shown when metrics don't exist */}
        {!idea.metrics && onGenerateScores && (
          <Card className="border border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Score This Idea
                    </h3>
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                      Generate analysis: uniqueness, feasibility, innovation & market fit
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasUnscoredIdeas && (
                    <Button
                      onClick={() => onGenerateScores && onGenerateScores(idea.id, true)}
                      disabled={isScoringAll}
                      variant="outline"
                      className="h-9 px-3 text-xs shrink-0"
                      size="sm"
                    >
                      {isScoringAll ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          All...
                        </>
                      ) : (
                        "Score All"
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => onGenerateScores && onGenerateScores(idea.id, false)}
                    disabled={isScoring}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-xs shrink-0"
                    size="sm"
                  >
                    {isScoring ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        Scoring...
                      </>
                    ) : (
                      "Score"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Uniqueness Analysis */}
        {uniquenessAnalysis && (
          <Card className="border-2">
            <div
              className="px-4 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
              onClick={() => setIsUniquenessExpanded(!isUniquenessExpanded)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-semibold">Uniqueness</span>
                <div className="group relative">
                  <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-[100] w-48">
                    <div className="bg-neutral-900 text-white text-[10px] rounded-lg p-2 shadow-lg">
                      <p className="font-semibold mb-1">How Uniqueness is Scored:</p>
                      <p className="opacity-90">Based on technology innovation, business model novelty, market approach differentiation, and solution originality.</p>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 border-4 border-transparent border-b-neutral-900" />
                    </div>
                  </div>
                </div>
              </div>
              {isUniquenessExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>

            {isUniquenessExpanded && (
              <div className="p-4 space-y-3">
                {/* Score Display */}
                <div className={cn("p-3 rounded-lg", getUniquenessBg())}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">Uniqueness Score</span>
                    <span className={cn("text-xl font-bold", getUniquenessColor())}>
                      {uniquenessAnalysis.score}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getUniquenessProgress())}
                      style={{ width: `${uniquenessAnalysis.score}%` }}
                    />
                  </div>
                </div>

                {/* Factors */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-semibold">Key Factors</p>
                    <div className="group relative">
                      <Info className="h-3 w-3 text-neutral-400 hover:text-neutral-600" />
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-[100] w-44">
                        <div className="bg-neutral-900 text-white text-[10px] rounded-lg p-2 shadow-lg">
                          <p className="font-semibold mb-1">Why Key Factors:</p>
                          <p className="opacity-90">Breaks down uniqueness into specific dimensions to identify strengths and areas for improvement.</p>
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 border-4 border-transparent border-b-neutral-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(uniquenessAnalysis.factors).map(([key, value]) => {
                      const icons = {
                        technology: <Cpu className="h-3.5 w-3.5 text-purple-600" />,
                        businessModel: <Briefcase className="h-3.5 w-3.5 text-blue-600" />,
                        marketApproach: <TrendingUp className="h-3.5 w-3.5 text-green-600" />,
                        solutionNovelty: <Lightbulb className="h-3.5 w-3.5 text-amber-600" />,
                      };
                      const labels = {
                        technology: 'Technology',
                        businessModel: 'Business Model',
                        marketApproach: 'Market Approach',
                        solutionNovelty: 'Solution Novelty',
                      };
                      return (
                        <div key={key} className="p-2 rounded-lg bg-muted/30 border border-border">
                          <div className="flex items-start gap-2">
                            {icons[key as keyof typeof icons]}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-xs">
                                  {labels[key as keyof typeof labels]}
                                </span>
                                <span className={cn("font-bold text-xs", getUniquenessColor())}>{value.score}</span>
                              </div>
                              <p className="text-neutral-600 dark:text-neutral-400 text-[10px] leading-relaxed">{value.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comparison */}
                {(uniquenessAnalysis.comparison.moreUnique.length > 0 || uniquenessAnalysis.comparison.similarTo.length > 0) && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-1.5 mb-2">
                      <p className="text-xs font-semibold">Market Comparison</p>
                      <div className="group relative">
                        <Info className="h-3 w-3 text-neutral-400 hover:text-neutral-600" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-[100] w-44">
                          <div className="bg-neutral-900 text-white text-[10px] rounded-lg p-2 shadow-lg">
                            <p className="font-semibold mb-1">Why Market Comparison:</p>
                            <p className="opacity-90">Compares your idea against others to highlight competitive positioning and differentiation opportunities.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 border-4 border-transparent border-b-neutral-900" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {uniquenessAnalysis.comparison.moreUnique.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] text-neutral-500 mb-1">More unique than:</p>
                        <div className="flex flex-wrap gap-1">
                          {uniquenessAnalysis.comparison.moreUnique.map((name) => (
                            <Badge key={name} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {uniquenessAnalysis.comparison.similarTo.length > 0 && (
                      <div>
                        <p className="text-[10px] text-neutral-500 mb-1">Similar to:</p>
                        <div className="flex flex-wrap gap-1">
                          {uniquenessAnalysis.comparison.similarTo.map((name) => (
                            <Badge key={name} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Insights */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-yellow-600" />
                    Key Insights
                  </p>
                  <ul className="space-y-1">
                    {uniquenessAnalysis.insights.map((insight, idx) => (
                      <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Feasibility Analysis */}
        {feasibilityAnalysis && (
          <Card className="border-2">
            <div
              className="px-4 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
              onClick={() => setIsFeasibilityExpanded(!isFeasibilityExpanded)}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold">Feasibility</span>
                <div className="group relative">
                  <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-[100] w-48">
                    <div className="bg-neutral-900 text-white text-[10px] rounded-lg p-2 shadow-lg">
                      <p className="font-semibold mb-1">How Feasibility is Scored:</p>
                      <p className="opacity-90">Based on technical complexity, resource requirements, timeline to market, and execution risk.</p>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 border-4 border-transparent border-b-neutral-900" />
                    </div>
                  </div>
                </div>
              </div>
              {isFeasibilityExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>

            {isFeasibilityExpanded && (
              <div className="p-4 space-y-3">
                {/* Score Display */}
                <div className={cn("p-3 rounded-lg", getFeasibilityBg())}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">Feasibility Score</span>
                    <span className={cn("text-xl font-bold", getFeasibilityColor())}>
                      {feasibilityAnalysis.score}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getFeasibilityProgress())}
                      style={{ width: `${feasibilityAnalysis.score}%` }}
                    />
                  </div>
                </div>

                {/* Factors */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-semibold">Implementation Factors</p>
                    <div className="group relative">
                      <Info className="h-3 w-3 text-neutral-400 hover:text-neutral-600" />
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-[100] w-44">
                        <div className="bg-neutral-900 text-white text-[10px] rounded-lg p-2 shadow-lg">
                          <p className="font-semibold mb-1">Why Implementation Factors:</p>
                          <p className="opacity-90">Breaks down feasibility into technical, resource, and timeline dimensions to identify implementation challenges.</p>
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 border-4 border-transparent border-b-neutral-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {feasibilityAnalysis.factors.technicalComplexity && (
                      <div className="p-2 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-start gap-2">
                          <Cpu className="h-3.5 w-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-neutral-700 dark:text-neutral-300 text-xs">Technical</span>
                              <span className={cn("font-bold text-xs", getFeasibilityColor())}>
                                {feasibilityAnalysis.factors.technicalComplexity.score}
                              </span>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 text-[10px] leading-relaxed">{feasibilityAnalysis.factors.technicalComplexity.description}</p>
                            {feasibilityAnalysis.factors.technicalComplexity.challenge && (
                              <p className="text-[9px] text-orange-600 mt-1">⚠️ {feasibilityAnalysis.factors.technicalComplexity.challenge}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {feasibilityAnalysis.factors.resourceRequirements && (
                      <div className="p-2 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-start gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-neutral-700 dark:text-neutral-300 text-xs">Resources</span>
                              <span className={cn("font-bold text-xs", getFeasibilityColor())}>
                                {feasibilityAnalysis.factors.resourceRequirements.score}
                              </span>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 text-[10px] leading-relaxed">{feasibilityAnalysis.factors.resourceRequirements.description}</p>
                            {feasibilityAnalysis.factors.resourceRequirements.needs && (
                              <p className="text-[9px] text-blue-600 mt-1">💼 {feasibilityAnalysis.factors.resourceRequirements.needs}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {feasibilityAnalysis.factors.timeline && (
                      <div className="p-2 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-neutral-700 dark:text-neutral-300 text-xs">Timeline</span>
                              <span className={cn("font-bold text-xs", getFeasibilityColor())}>
                                {feasibilityAnalysis.factors.timeline.score}
                              </span>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 text-[10px] leading-relaxed">{feasibilityAnalysis.factors.timeline.estimatedTime}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strengths */}
                {feasibilityAnalysis.strengths.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Strengths
                    </p>
                    <ul className="space-y-1">
                      {feasibilityAnalysis.strengths.map((strength, idx) => (
                        <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Challenges */}
                {feasibilityAnalysis.challenges.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      Challenges
                    </p>
                    <ul className="space-y-1">
                      {feasibilityAnalysis.challenges.map((challenge, idx) => (
                        <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {feasibilityAnalysis.recommendations.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <Target className="h-3 w-3 text-purple-600" />
                      Recommendations
                    </p>
                    <ul className="space-y-1">
                      {feasibilityAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-1">
                          <Target className="h-3 w-3 text-purple-600 flex-shrink-0 mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Critical Evaluation */}
        {idea.evaluation && (
          <Card className="border-2">
            <div
              className="px-4 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
              onClick={() => setIsEvaluationExpanded(!isEvaluationExpanded)}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold">Critical Evaluation</span>
              </div>
              {isEvaluationExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>

            {isEvaluationExpanded && (
              <div className="p-4 space-y-3">
                {idea.evaluation.criticalQuestions && idea.evaluation.criticalQuestions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <Target className="h-3 w-3 text-purple-600" />
                      Critical Questions
                    </p>
                    <ul className="space-y-1">
                      {idea.evaluation.criticalQuestions.map((question, idx) => (
                        <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-1">
                          <Target className="h-3 w-3 text-purple-600 flex-shrink-0 mt-0.5" />
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {idea.evaluation.assumptions && idea.evaluation.assumptions.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold mb-2">Key Assumptions</p>
                    <ul className="space-y-1">
                      {idea.evaluation.assumptions.map((assumption, idx) => (
                        <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300">
                          • {assumption}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Sticky Footer - Selection Button */}
      {onSelect && idea && (
        <div className="flex-shrink-0 px-6 py-4 border-t bg-background/95 backdrop-blur">
          <Button
            onClick={() => onSelect(idea.id)}
            className={cn(
              "w-full font-semibold transition-all",
              selectedIdeaId === idea.id
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
            size="lg"
          >
            {selectedIdeaId === idea.id ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Selected for Appraisal
              </>
            ) : (
              <>
                <Target className="h-5 w-5 mr-2" />
                Select this idea for appraisal
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
