"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Sparkles } from "lucide-react";

/**
 * Welcome tooltip shown to returning users
 * Displays brief greeting after they've already completed the tour
 */
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
        <CardContent className="p-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
