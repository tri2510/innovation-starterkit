"use client";

import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Target,
  TrendingUp,
  Lightbulb as IdeaIcon,
  DollarSign,
  FileText,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CaseStudy, CaseStudyPhaseType } from "@/types/innovation";

interface CaseStudyWalkthroughProps {
  caseStudy: CaseStudy;
  onClose: () => void;
}

const PHASES: Array<{ value: CaseStudyPhaseType; label: string; icon: any }> = [
  { value: "challenge", label: "Challenge", icon: Target },
  { value: "market", label: "Market", icon: TrendingUp },
  { value: "ideation", label: "Ideation", icon: Lightbulb },
  { value: "investment-appraisal", label: "Investment", icon: DollarSign },
  { value: "pitch", label: "Pitch", icon: FileText },
];

const BUSINESS_MODEL_LABELS: Record<string, string> = {
  marketplace: "Marketplace",
  saas: "SaaS",
  "on-demand": "On-Demand",
  subscription: "Subscription",
  freemium: "Freemium",
  "e-commerce": "E-Commerce",
};

export function CaseStudyWalkthrough({ caseStudy, onClose }: CaseStudyWalkthroughProps) {
  const [currentPhase, setCurrentPhase] = useState<CaseStudyPhaseType>("challenge");

  const phaseIndex = PHASES.findIndex((p) => p.value === currentPhase);
  const currentPhaseData = caseStudy.phases[currentPhase];
  const PhaseIcon = PHASES[phaseIndex].icon;

  const goToPreviousPhase = () => {
    if (phaseIndex > 0) {
      setCurrentPhase(PHASES[phaseIndex - 1].value);
    }
  };

  const goToNextPhase = () => {
    if (phaseIndex < PHASES.length - 1) {
      setCurrentPhase(PHASES[phaseIndex + 1].value);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{caseStudy.title}</h2>
              <p className="text-muted-foreground mt-1">{caseStudy.tagline}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 p-2"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Company:</span>
              <span className="font-medium">{caseStudy.company}</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Founded:</span>
              <span className="font-medium">{caseStudy.yearFounded}</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline" className="text-xs">
              {BUSINESS_MODEL_LABELS[caseStudy.businessModel]}
            </Badge>
          </div>

          {/* Phase Tabs */}
          <Tabs value={currentPhase} onValueChange={(v) => setCurrentPhase(v as CaseStudyPhaseType)} className="mt-4">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              {PHASES.map((phase) => {
                const Icon = phase.icon;
                const isActive = currentPhase === phase.value;
                const isComplete = PHASES.findIndex((p) => p.value === currentPhase) >= phaseIndex;

                return (
                  <TabsTrigger
                    key={phase.value}
                    value={phase.value}
                    className="flex flex-col gap-1 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{phase.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Phase Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Phase Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                currentPhase === "challenge"
                  ? "bg-red-100"
                  : currentPhase === "market"
                  ? "bg-blue-100"
                  : currentPhase === "ideation"
                  ? "bg-purple-100"
                  : currentPhase === "investment-appraisal"
                  ? "bg-green-100"
                  : "bg-orange-100"
              }`}>
                <PhaseIcon className={`h-6 w-6 ${
                  currentPhase === "challenge"
                    ? "text-red-600"
                    : currentPhase === "market"
                    ? "text-blue-600"
                    : currentPhase === "ideation"
                    ? "text-purple-600"
                    : currentPhase === "investment-appraisal"
                    ? "text-green-600"
                    : "text-orange-600"
                }`} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{PHASES[phaseIndex].label} Phase</h3>
                <p className="text-sm text-muted-foreground">
                  How {caseStudy.title} approached this phase
                </p>
              </div>
            </div>

            {/* Phase Content */}
            <div className="space-y-6">
              {currentPhase === "challenge" && (
                <>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Problem Statement</h4>
                    <p className="text-base leading-relaxed">{(currentPhaseData as any).problem}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Target Audience</h4>
                    <p className="text-base leading-relaxed">{(currentPhaseData as any).targetAudience}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Existing Solutions</h4>
                    <p className="text-base leading-relaxed">{(currentPhaseData as any).currentSolutions}</p>
                  </div>
                </>
              )}

              {currentPhase === "market" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Market Size</h4>
                      <p className="text-base font-medium">{(currentPhaseData as any).marketSize}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Target Segment</h4>
                      <p className="text-base font-medium">{(currentPhaseData as any).targetSegment}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Competitors</h4>
                    <ul className="space-y-1">
                      {(currentPhaseData as any).competitors.map((competitor: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          <span>{competitor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Opportunities</h4>
                    <ul className="space-y-1">
                      {(currentPhaseData as any).opportunities.map((opportunity: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600">✓</span>
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {currentPhase === "ideation" && (
                <>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Initial Idea</h4>
                    <p className="text-base leading-relaxed">{(currentPhaseData as any).initialIdea}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Pivots</h4>
                    <ul className="space-y-2">
                      {(currentPhaseData as any).pivots.map((pivot: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm bg-purple-50 border border-purple-100 rounded-lg p-3">
                          <span className="text-purple-600 font-semibold">↻</span>
                          <span>{pivot}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Final Value Proposition</h4>
                    <p className="text-base leading-relaxed font-medium">{(currentPhaseData as any).finalValueProp}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Features</h4>
                    <ul className="space-y-1">
                      {(currentPhaseData as any).keyFeatures.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {currentPhase === "investment-appraisal" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Initial Investment</h4>
                      <p className="text-lg font-semibold text-green-700">{(currentPhaseData as any).initialInvestment}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">ROI</h4>
                      <p className="text-lg font-semibold text-blue-700">{(currentPhaseData as any).roi}</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Time to Profit</h4>
                    <p className="text-base">{(currentPhaseData as any).breakEvenTimeframe}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Funding Journey</h4>
                    <ul className="space-y-2">
                      {(currentPhaseData as any).fundingRounds.map((round: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm bg-muted/50 rounded p-3">
                          <span className="text-muted-foreground font-mono">{idx + 1}.</span>
                          <span>{round}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {currentPhase === "pitch" && (
                <>
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-lg p-6 text-center">
                    <h2 className="text-2xl font-bold">{(currentPhaseData as any).title}</h2>
                    <p className="text-lg text-muted-foreground mt-2">{(currentPhaseData as any).tagline}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Pitch Slides</h4>
                    <ul className="space-y-2">
                      {(currentPhaseData as any).keySlides.map((slide: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm bg-muted/50 rounded p-3">
                          <span className="text-orange-600 font-semibold">▸</span>
                          <span>{slide}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Key Learning Callout */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
                <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-primary mb-1">Key Insight</h4>
                  <p className="text-sm text-foreground">{(currentPhaseData as any).keyInsight}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousPhase}
            disabled={phaseIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous: {phaseIndex > 0 ? PHASES[phaseIndex - 1].label : "Start"}
          </Button>

          <div className="text-sm text-muted-foreground">
            Phase {phaseIndex + 1} of {PHASES.length}
          </div>

          <Button
            onClick={goToNextPhase}
            disabled={phaseIndex === PHASES.length - 1}
            className="bg-primary hover:bg-primary/90"
          >
            {phaseIndex < PHASES.length - 1 ? (
              <>
                Next: {PHASES[phaseIndex + 1].label}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              "Complete"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
