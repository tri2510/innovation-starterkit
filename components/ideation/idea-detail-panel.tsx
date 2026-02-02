'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
  X,
  Cpu,
  Briefcase,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BusinessIdea } from '@/types/innovation';
import { cn } from '@/lib/utils';

interface IdeaDetailPanelProps {
  idea: BusinessIdea;
  marketAnalysis: any;
  allIdeas: BusinessIdea[];
  onClose: () => void;
  onSelect?: (ideaId: string) => void;
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

export function IdeaDetailPanel({
  idea,
  marketAnalysis,
  allIdeas,
  onClose,
  onSelect,
}: IdeaDetailPanelProps) {
  const [uniquenessAnalysis, setUniquenessAnalysis] = useState<UniquenessAnalysis | null>(null);
  const [feasibilityAnalysis, setFeasibilityAnalysis] = useState<FeasibilityAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUniquenessExpanded, setIsUniquenessExpanded] = useState(true);
  const [isFeasibilityExpanded, setIsFeasibilityExpanded] = useState(true);

  // Generate analysis when panel opens or when idea changes
  useEffect(() => {
    generateAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea]);

  const generateAnalysis = async () => {
    setIsGenerating(true);

    // Simulate analysis (in production, this would call AI)
    // For now, generate based on idea metrics and comparison with other ideas
    const uniquenessScore = idea.metrics?.uniqueness || 70;
    const feasibilityScore = idea.metrics?.feasibility || 70;

    // Generate uniqueness analysis
    const uniqueAnalysis: UniquenessAnalysis = {
      score: uniquenessScore,
      factors: {
        technology: {
          score: Math.round(Math.min(100, uniquenessScore + Math.random() * 10 - 5)),
          description: idea.searchFields?.technologies?.join(', ') || 'General technology',
        },
        businessModel: {
          score: Math.round(Math.min(100, uniquenessScore + Math.random() * 10 - 5)),
          description: 'Novel approach to value creation and customer capture',
        },
        marketApproach: {
          score: Math.round(Math.min(100, uniquenessScore + Math.random() * 10 - 5)),
          description: `Targeting ${marketAnalysis?.som || 'specific market segment'}`,
        },
        solutionNovelty: {
          score: Math.round(Math.min(100, uniquenessScore + Math.random() * 10 - 5)),
          description: 'Innovative solution to the identified problem',
        },
      },
      comparison: {
        moreUnique: allIdeas
          .filter(i => i.id !== idea.id && i.metrics?.uniqueness && i.metrics.uniqueness < uniquenessScore)
          .slice(0, 2)
          .map(i => i.name),
        similarTo: allIdeas
          .filter(i => i.id !== idea.id && i.metrics?.uniqueness && i.metrics.uniqueness >= uniquenessScore - 10)
          .slice(0, 2)
          .map(i => i.name),
      },
      insights: [
        uniquenessScore > 80
          ? 'Highly unique approach with strong differentiation potential'
          : uniquenessScore > 60
          ? 'Moderately unique with some distinct elements'
          : 'Similar to existing solutions, consider further innovation',
        `Uses ${idea.searchFields?.technologies?.join(', ') || 'available'} technologies`,
        `Addresses problem: ${idea.problemSolved.substring(0, 80)}...`,
      ],
    };

    // Generate feasibility analysis
    const feasibilityAnalysisData: FeasibilityAnalysis = {
      score: feasibilityScore,
      factors: {
        technicalComplexity: {
          score: Math.round(Math.min(100, feasibilityScore + Math.random() * 10 - 5)),
          description: 'Technical implementation complexity',
          challenge: feasibilityScore < 70 ? 'Requires advanced R&D and specialized expertise' : 'Proven technology stack',
        },
        resourceRequirements: {
          score: Math.round(Math.min(100, feasibilityScore + Math.random() * 10 - 5)),
          description: 'Capital and human resource needs',
          needs: feasibilityScore < 70 ? 'Significant investment in skilled personnel and infrastructure' : 'Standard resource requirements',
        },
        timeline: {
          score: Math.round(Math.min(100, feasibilityScore + Math.random() * 10 - 5)),
          description: 'Time to develop and launch',
          estimatedTime: feasibilityScore > 80 ? '6-12 months to MVP' : feasibilityScore > 60 ? '12-18 months' : '18-24 months',
        },
        riskLevel: {
          score: Math.round(Math.min(100, feasibilityScore + Math.random() * 10 - 5)),
          description: 'Overall execution risk',
        },
      },
      strengths: [
        feasibilityScore > 70 ? 'Clear problem-solution fit' : 'Challenging but addressable',
        feasibilityScore > 60 ? 'Market opportunity exists' : 'Requires market validation',
        idea.searchFields?.industries?.map(i => `Aligns with ${i} industry trends`).join(', ') || 'Industry relevant',
      ].filter(Boolean),
      challenges: [
        feasibilityScore < 80 ? 'Technical implementation challenges' : 'Standard development risks',
        feasibilityScore < 70 ? 'Resource-intensive' : 'Requires careful resource planning',
        feasibilityScore < 60 ? 'Extended timeline to market' : 'Moderate development timeline',
      ].filter(Boolean),
      recommendations: [
        feasibilityScore > 80 ? 'Ready for immediate development' : 'Consider technical proof-of-concept',
        feasibilityScore > 60 ? 'Start with core features, expand over time' : 'Phased approach recommended',
        'Validate with target customers early',
        'Build cross-functional team with relevant expertise',
      ],
    };

    setUniquenessAnalysis(uniqueAnalysis);
    setFeasibilityAnalysis(feasibilityAnalysisData);
    setIsGenerating(false);
  };

  const getUniquenessColor = () => 'text-purple-700 dark:text-purple-300';
  const getUniquenessBg = () => 'bg-purple-50 dark:bg-purple-900/20';
  const getUniquenessProgress = () => 'bg-purple-500';

  const getFeasibilityColor = () => 'text-blue-700 dark:text-blue-300';
  const getFeasibilityBg = () => 'bg-blue-50 dark:bg-blue-900/20';
  const getFeasibilityProgress = () => 'bg-blue-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[360px] bg-background border-l shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Idea Analysis</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{idea.name}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />
              <p className="text-sm text-muted-foreground">Analyzing idea...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Uniqueness Section */}
            <Card className="border-2">
              <div
                className="px-4 py-2 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                onClick={() => setIsUniquenessExpanded(!isUniquenessExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold">Uniqueness</span>
                  {/* Info Icon with Tooltip */}
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

              {isUniquenessExpanded && uniquenessAnalysis && (
                <div className="p-4 space-y-3">
                  {/* Score Display */}
                  <div className={cn("p-3 rounded-lg", getUniquenessBg())}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">Uniqueness Score</span>
                      <span className={cn("text-xl font-bold", getUniquenessColor())}>
                        {uniquenessAnalysis.score}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
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

            {/* Feasibility Section */}
            <Card className="border-2">
              <div
                className="px-4 py-2 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                onClick={() => setIsFeasibilityExpanded(!isFeasibilityExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold">Feasibility</span>
                  {/* Info Icon with Tooltip */}
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

              {isFeasibilityExpanded && feasibilityAnalysis && (
                <div className="p-4 space-y-3">
                  {/* Score Display */}
                  <div className={cn("p-3 rounded-lg", getFeasibilityBg())}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">Feasibility Score</span>
                      <span className={cn("text-xl font-bold", getFeasibilityColor())}>
                        {feasibilityAnalysis.score}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
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

            {/* Select Idea Button */}
            {onSelect && (
              <Button
                onClick={() => onSelect(idea.id)}
                className="w-full"
                size="lg"
              >
                Select This Idea
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
