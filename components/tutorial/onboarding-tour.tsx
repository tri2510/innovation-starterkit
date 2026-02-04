"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, MessageSquare, Layout, Target, Sparkles, ArrowRight } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: { top: string; left: string };
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Innovation Kit! 🚀",
    description: "This interactive tool will help you transform your ideas into a professional pitch deck. Let me show you how it works.",
    icon: <Sparkles className="h-6 w-6" />,
    position: { top: "50%", left: "50%" },
  },
  {
    id: "chat",
    title: "AI-Powered Chat",
    description: "I'm your AI consultant! I'll ask you questions about your innovation challenge and help refine your answers. Just type your response and press Enter.",
    icon: <MessageSquare className="h-6 w-6" />,
    position: { top: "60%", left: "30%" },
    highlight: "chat-area",
  },
  {
    id: "progress",
    title: "Progress Tracker",
    description: "See what information we've gathered. All required fields (marked with dots) must be completed before proceeding to the next step.",
    icon: <Target className="h-6 w-6" />,
    position: { top: "30%", left: "70%" },
    highlight: "progress-area",
  },
  {
    id: "steps",
    title: "6-Step Innovation Journey",
    description: "We'll guide you through: Define → Market → Ideate → Select → Review → Pitch. Each step builds on the previous one.",
    icon: <Layout className="h-6 w-6" />,
    position: { top: "15%", left: "50%" },
    highlight: "header-area",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem("innovation-kit-tour-completed");
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("innovation-kit-tour-completed", "true");
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="max-w-md w-full mx-4 shadow-2xl border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          {/* Progress Dots */}
          <div className="flex gap-2 mb-6">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-slate-800 dark:bg-slate-200" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white">
              {step.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{step.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{step.description}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Skip Tour
              </Button>
              <Button
                onClick={handleNext}
                className="bg-slate-900 hover:bg-slate-800 text-white"
                size="sm"
              >
                {isLastStep ? "Get Started" : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact welcome tooltip for returning users
export function WelcomeTooltip() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("innovation-kit-tour-completed");
    const hasSeenWelcome = localStorage.getItem("innovation-kit-welcome-seen");

    if (hasSeenTour && !hasSeenWelcome) {
      // Show brief welcome after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("innovation-kit-welcome-seen", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Welcome back! Ready to continue your innovation journey?</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
