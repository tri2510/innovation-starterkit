"use client";

import { useCaseStudy } from "@/contexts/case-study-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, TrendingUp, Lightbulb as IdeaIcon, DollarSign, FileText } from "lucide-react";
import { usePathname } from "next/navigation";

interface CaseStudyPhaseViewerProps {
  phase: "challenge" | "market" | "ideation" | "investment-appraisal" | "pitch";
}

export function CaseStudyPhaseViewer({ phase }: CaseStudyPhaseViewerProps) {
  const { caseStudy } = useCaseStudy();

  if (!caseStudy) return null;

  const phaseData = caseStudy.phases[phase];
  if (!phaseData) return null;

  const phaseConfig = {
    challenge: {
      icon: Target,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
      label: "Challenge Phase",
    },
    market: {
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      label: "Market Analysis Phase",
    },
    ideation: {
      icon: IdeaIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      label: "Ideation Phase",
    },
    "investment-appraisal": {
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
      label: "Investment Appraisal Phase",
    },
    pitch: {
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
      label: "Pitch Phase",
    },
  };

  const config = phaseConfig[phase];
  const PhaseIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Phase Header Card */}
      <Card className={`${config.bgColor} ${config.borderColor} border`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${config.bgColor} ${config.borderColor} border`}>
              <PhaseIcon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{config.label}</h3>
              <p className="text-sm text-muted-foreground">
                How {caseStudy.title} approached this phase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Content */}
      {phase === "challenge" && (
        <>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Problem Statement</h4>
                <p className="text-base leading-relaxed">{(phaseData as any).problem}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Target Audience</h4>
                <p className="text-base leading-relaxed">{(phaseData as any).targetAudience}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Existing Solutions</h4>
                <p className="text-base leading-relaxed">{(phaseData as any).currentSolutions}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {phase === "market" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Market Size</h4>
                <p className="text-base font-medium">{(phaseData as any).marketSize}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Target Segment</h4>
                <p className="text-base font-medium">{(phaseData as any).targetSegment}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">Competitors</h4>
              <ul className="space-y-2">
                {(phaseData as any).competitors.map((competitor: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm bg-muted/50 rounded p-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{competitor}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">Opportunities</h4>
              <ul className="space-y-2">
                {(phaseData as any).opportunities.map((opportunity: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm bg-green-50 border border-green-100 rounded p-2">
                    <span className="text-green-600">✓</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {phase === "ideation" && (
        <>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Initial Idea</h4>
                <p className="text-base leading-relaxed">{(phaseData as any).initialIdea}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Pivots</h4>
                <ul className="space-y-2">
                  {(phaseData as any).pivots.map((pivot: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm bg-purple-50 border border-purple-100 rounded p-3">
                      <span className="text-purple-600 font-semibold">↻</span>
                      <span>{pivot}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Final Value Proposition</h4>
                <p className="text-base leading-relaxed font-medium">{(phaseData as any).finalValueProp}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Features</h4>
                <ul className="space-y-1">
                  {(phaseData as any).keyFeatures.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {phase === "investment-appraisal" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Initial Investment</h4>
                <p className="text-lg font-semibold text-green-700">{(phaseData as any).initialInvestment}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">ROI</h4>
                <p className="text-lg font-semibold text-blue-700">{(phaseData as any).roi}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Time to Profit</h4>
              <p className="text-base">{(phaseData as any).breakEvenTimeframe}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">Funding Journey</h4>
              <ul className="space-y-2">
                {(phaseData as any).fundingRounds.map((round: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm bg-muted/50 rounded p-3">
                    <span className="text-muted-foreground font-mono">{idx + 1}.</span>
                    <span>{round}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {phase === "pitch" && (
        <>
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold">{(phaseData as any).title}</h2>
              <p className="text-lg text-muted-foreground mt-2">{(phaseData as any).tagline}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">Key Pitch Slides</h4>
              <ul className="space-y-2">
                {(phaseData as any).keySlides.map((slide: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm bg-muted/50 rounded p-3">
                    <span className="text-orange-600 font-semibold">▸</span>
                    <span>{slide}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {/* Key Learning Callout */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex gap-3">
          <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-primary mb-1">Key Insight</h4>
            <p className="text-sm text-foreground">{(phaseData as any).keyInsight}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
