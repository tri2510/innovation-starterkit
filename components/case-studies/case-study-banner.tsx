"use client";

import { X, BookOpen, ArrowRight, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCaseStudy } from "@/contexts/case-study-context";
import { useRouter, usePathname } from "next/navigation";

const PHASE_ROUTES: Record<string, string> = {
  challenge: "/challenge",
  market: "/market",
  ideation: "/ideation",
  "investment-appraisal": "/investment-appraisal",
  pitch: "/pitch",
};

const PHASE_ORDER: Array<{ key: string; label: string }> = [
  { key: "challenge", label: "Challenge" },
  { key: "market", label: "Market" },
  { key: "ideation", label: "Ideation" },
  { key: "investment-appraisal", label: "Investment" },
  { key: "pitch", label: "Pitch" },
];

export function CaseStudyBanner() {
  const { isActive, caseStudy, exitCaseStudyMode } = useCaseStudy();
  const router = useRouter();
  const pathname = usePathname();

  if (!isActive || !caseStudy) return null;

  // Find current phase index
  const currentPhaseIndex = PHASE_ORDER.findIndex(
    (phase) => pathname === PHASE_ROUTES[phase.key]
  );

  const hasNextPhase = currentPhaseIndex < PHASE_ORDER.length - 1;
  const nextPhase = hasNextPhase ? PHASE_ORDER[currentPhaseIndex + 1] : null;

  const goToNextPhase = () => {
    if (nextPhase) {
      router.push(PHASE_ROUTES[nextPhase.key]);
    }
  };

  const goToPreviousPhase = () => {
    if (currentPhaseIndex > 0) {
      const prevPhase = PHASE_ORDER[currentPhaseIndex - 1];
      router.push(PHASE_ROUTES[prevPhase.key]);
    } else {
      // If at first phase, go to home
      router.push("/");
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Case Study Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Case Study Mode
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-sm">{caseStudy.title}</span>
                <span className="text-muted-foreground text-sm">•</span>
                <span className="text-sm text-muted-foreground">{caseStudy.tagline}</span>
              </div>
            </div>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-2">
            {/* Phase Progress Indicator */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              {PHASE_ORDER.map((phase, index) => {
                const isCompleted = index < currentPhaseIndex;
                const isCurrent = index === currentPhaseIndex;

                return (
                  <div
                    key={phase.key}
                    className={`h-1.5 rounded-full transition-colors ${
                      isCurrent
                        ? "bg-primary w-8"
                        : isCompleted
                        ? "bg-primary/50 w-6"
                        : "bg-muted w-4"
                    }`}
                  />
                );
              })}
            </div>

            {/* Back Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPhase}
              className="border-border hover:bg-muted"
            >
              {currentPhaseIndex === 0 ? (
                <>
                  <Home className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Home</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Back</span>
                </>
              )}
            </Button>

            {/* Next Phase Button */}
            {hasNextPhase && nextPhase && (
              <Button
                size="sm"
                onClick={goToNextPhase}
                className="bg-primary hover:bg-primary/90"
              >
                {nextPhase.label}
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}

            {/* Exit Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={exitCaseStudyMode}
              className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600"
            >
              <X className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>

        {/* Phase Indicators for Mobile */}
        <div className="flex sm:hidden items-center gap-1 mt-2">
          {PHASE_ORDER.map((phase, index) => {
            const isCompleted = index < currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;

            return (
              <div
                key={phase.key}
                className={`h-1.5 rounded-full transition-colors flex-1 ${
                  isCurrent
                    ? "bg-primary"
                    : isCompleted
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
