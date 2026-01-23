"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { clearSession } from "@/lib/session";

interface WizardNavProps {
  currentStep: string;
  onNext?: () => void;
  onPrevious?: () => void;
  showRestart?: boolean;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
}

export function WizardNav({
  currentStep,
  onNext,
  onPrevious,
  showRestart = false,
  nextLabel = "Continue",
  isNextDisabled = false,
  isNextLoading = false,
}: WizardNavProps) {
  const router = useRouter();

  const steps = ["challenge", "market", "ideation", "investment-appraisal", "pitch"];
  const currentIndex = steps.indexOf(currentStep);
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentIndex === steps.length - 1;

  const handleRestart = () => {
    if (confirm("Are you sure you want to start over? This will clear all your progress.")) {
      clearSession();
      // Force a full page reload to ensure all state is cleared
      window.location.href = "/challenge";
    }
  };

  return (
    <nav className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {!isFirstStep && onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        {showRestart && (
          <Button variant="ghost" size="sm" onClick={handleRestart}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onNext && !isLastStep && (
          <Button onClick={onNext} disabled={isNextDisabled || isNextLoading}>
            {nextLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );
}
