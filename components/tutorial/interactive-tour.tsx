"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, MessageSquare, Layout, Target, Sparkles, Check, BookOpen, Home } from "lucide-react";
import { useCaseStudy } from "@/contexts/case-study-context";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: string; // CSS selector for the element to highlight
  position: "top" | "bottom" | "left" | "right" | "center";
  mode?: "normal" | "case-study" | "both"; // When to show this step
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Innovation Kit! 🚀",
    description: "This interactive tool will help you transform your ideas into a professional pitch deck. Let me show you how it works.",
    icon: <Sparkles className="h-6 w-6" />,
    target: "body",
    position: "center",
    mode: "both",
  },
  {
    id: "case-study-mode",
    title: "Explore Real Innovations",
    description: "Click 'Browse Case Studies' to explore successful innovations from Tesla, DJI, Nest, and more. Learn from real-world examples across industrial IoT, robotics, and automotive.",
    icon: <BookOpen className="h-6 w-6" />,
    target: "button:has([data-action='browse-case-studies'])",
    position: "bottom",
    mode: "normal",
  },
  {
    id: "progress-bar",
    title: "Your 6-Step Journey",
    description: "Track your progress through Define → Market → Ideate → Select → Review → Pitch. The blue bar shows your current step. Click any completed step to navigate back.",
    icon: <Layout className="h-6 w-6" />,
    target: "[data-progress-bar]",
    position: "bottom",
    mode: "normal",
  },
  {
    id: "case-study-banner",
    title: "Case Study Navigation",
    description: "Browse through real innovation examples: Tesla (EVs), Siemens MindSphere (IIoT), Nest (Smart Home), DJI (Drones), ABB YuMi (Cobots). Navigate between phases using the buttons.",
    icon: <BookOpen className="h-6 w-6" />,
    target: "[data-case-study-banner]",
    position: "bottom",
    mode: "case-study",
  },
  {
    id: "chat",
    title: "AI-Powered Chat",
    description: "I'm your AI consultant! I'll ask you questions about your innovation challenge. Just type your answers here and I'll guide you through each step.",
    icon: <MessageSquare className="h-6 w-6" />,
    target: "[data-chat-area]",
    position: "left",
    mode: "normal",
  },
  {
    id: "case-study-content",
    title: "Learn from Success",
    description: "Explore how successful innovations tackled each phase. Compare your approach with real-world examples from industry leaders in manufacturing, IoT, and automation.",
    icon: <BookOpen className="h-6 w-6" />,
    target: "[data-progress-area]",
    position: "right",
    mode: "case-study",
  },
  {
    id: "input",
    title: "Quick Responses",
    description: "Type your answer and press Enter, or click Send. You can also click the suggestion buttons to get started quickly with example ideas.",
    icon: <MessageSquare className="h-6 w-6" />,
    target: "textarea[placeholder*='Type your response']",
    position: "top",
    mode: "normal",
  },
  {
    id: "progress",
    title: "Progress Tracker",
    description: "See what information we've gathered. Required fields (with dots) must be completed before continuing. Click Edit to refine any field.",
    icon: <Target className="h-6 w-6" />,
    target: "[data-progress-area]",
    position: "right",
    mode: "normal",
  },
  {
    id: "case-study-exit",
    title: "Start Your Innovation",
    description: "Ready to work on your own idea? Click the Exit button to leave case study mode and start defining your innovation challenge.",
    icon: <Home className="h-6 w-6" />,
    target: "button:has([data-action='exit-case-study'])",
    position: "bottom",
    mode: "case-study",
  },
  {
    id: "complete",
    title: "Ready to Continue!",
    description: "Once all required fields are complete, click 'Analyze Market' to proceed to the next step. Your progress is saved automatically.",
    icon: <Check className="h-6 w-6" />,
    target: "button:has([data-action='continue'])",
    position: "top",
    mode: "normal",
  },
];

interface InteractiveTourProps {
  onComplete: () => void;
}

export function InteractiveTour({ onComplete }: InteractiveTourProps) {
  const { isActive: isCaseStudyActive } = useCaseStudy();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightedRect, setHighlightedRect] = useState<DOMRect | null>(null);

  // Filter tour steps based on current mode
  const filteredSteps = TOUR_STEPS.filter(step => {
    if (step.mode === "both") return true;
    if (step.mode === "case-study") return isCaseStudyActive;
    if (step.mode === "normal") return !isCaseStudyActive;
    return true;
  });

  useEffect(() => {
    if (!isVisible) return;

    const updateHighlight = () => {
      const step = filteredSteps[currentStep];
      if (step.target === "body") {
        setHighlightedRect(null);
        return;
      }

      const targetElement = document.querySelector(step.target) as HTMLElement;
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightedRect(rect);

        // Scroll target into view
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    updateHighlight();

    // Recalculate on window resize
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [isVisible, currentStep, isCaseStudyActive]);

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("innovation-kit-interactive-tour-completed", "true");
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = filteredSteps[currentStep];
  const isLastStep = currentStep === filteredSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate tooltip position with boundary checking
  const getTooltipPosition = () => {
    if (!highlightedRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 20;
    const tooltipWidth = 380;
    const tooltipHeight = 280;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Helper to check if position would be off-screen
    const wouldBeOffScreen = (top: number, left: number) => {
      return left < padding ||
             left + tooltipWidth > viewportWidth - padding ||
             top < padding ||
             top + tooltipHeight > viewportHeight - padding;
    };

    // Try the preferred position first
    let position: { top: string; left: string; transform: string };

    switch (step.position) {
      case "top": {
        const top = highlightedRect.top - tooltipHeight - padding;
        const left = highlightedRect.left + highlightedRect.width / 2 - tooltipWidth / 2;
        if (!wouldBeOffScreen(top, left)) {
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: "none",
          };
        }
        break;
      }
      case "bottom": {
        const top = highlightedRect.bottom + padding;
        const left = highlightedRect.left + highlightedRect.width / 2 - tooltipWidth / 2;
        if (!wouldBeOffScreen(top, left)) {
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: "none",
          };
        }
        break;
      }
      case "left": {
        const top = highlightedRect.top + highlightedRect.height / 2 - tooltipHeight / 2;
        const left = highlightedRect.left - tooltipWidth - padding;
        if (!wouldBeOffScreen(top, left)) {
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: "none",
          };
        }
        break;
      }
      case "right": {
        const top = highlightedRect.top + highlightedRect.height / 2 - tooltipHeight / 2;
        const left = highlightedRect.right + padding;
        if (!wouldBeOffScreen(top, left)) {
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: "none",
          };
        }
        break;
      }
    }

    // Fallback: find best available position
    const positions = [
      // Try right first
      {
        top: highlightedRect.top + highlightedRect.height / 2 - tooltipHeight / 2,
        left: highlightedRect.right + padding,
      },
      // Try bottom
      {
        top: highlightedRect.bottom + padding,
        left: highlightedRect.left + highlightedRect.width / 2 - tooltipWidth / 2,
      },
      // Try top
      {
        top: highlightedRect.top - tooltipHeight - padding,
        left: highlightedRect.left + highlightedRect.width / 2 - tooltipWidth / 2,
      },
      // Try left
      {
        top: highlightedRect.top + highlightedRect.height / 2 - tooltipHeight / 2,
        left: highlightedRect.left - tooltipWidth - padding,
      },
    ];

    // Find first position that fits
    for (const pos of positions) {
      if (!wouldBeOffScreen(pos.top, pos.left)) {
        return {
          top: `${pos.top}px`,
          left: `${pos.left}px`,
          transform: "none",
        };
      }
    }

    // Last resort: center in viewport
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  };

  const tooltipStyle = getTooltipPosition();

  return (
    <>
      {/* Spotlight Overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Dimmed background - no blur to keep highlighted element clear */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Highlighted element spotlight */}
        {highlightedRect && (
          <div
            className="absolute border-4 border-blue-500 rounded-lg bg-blue-500/10 transition-all duration-300"
            style={{
              top: `${highlightedRect.top - 4}px`,
              left: `${highlightedRect.left - 4}px`,
              width: `${highlightedRect.width + 8}px`,
              height: `${highlightedRect.height + 8}px`,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
            }}
          />
        )}
      </div>

      {/* Tooltip Card */}
      <div
        className="fixed z-[60] pointer-events-auto transition-all duration-300"
        style={tooltipStyle}
      >
        <Card className="w-[380px] shadow-2xl border-slate-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-slate-600 text-sm leading-relaxed mb-6">{step.description}</p>

            {/* Progress Dots */}
            <div className="flex gap-2 mb-6">
              {filteredSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-slate-800"
                      : index < currentStep
                        ? "bg-slate-300"
                        : "bg-slate-100"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Step {currentStep + 1} of {filteredSteps.length}
              </div>
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                  size="sm"
                >
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Got it!
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Skip Button */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </Card>
      </div>
    </>
  );
}

// Compact welcome tooltip for returning users
export function WelcomeTooltip() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("innovation-kit-interactive-tour-completed");
    const hasSeenWelcome = localStorage.getItem("innovation-kit-welcome-seen");

    if (hasSeenTour && !hasSeenWelcome) {
      // Show brief welcome after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("innovation-kit-welcome-seen", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="shadow-xl border-slate-200 bg-white">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Welcome back to your innovation journey!</p>
              <p className="text-xs text-slate-500 mt-1">Continue where you left off</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
