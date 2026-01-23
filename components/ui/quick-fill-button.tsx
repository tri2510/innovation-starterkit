"use client";

import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { isDemoMode } from "@/lib/demo-data";

interface QuickFillButtonProps {
  onFill: () => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Quick Fill Button for Demo Mode
 *
 * This button only renders when NEXT_PUBLIC_DEMO_MODE=true
 * To disable: Set NEXT_PUBLIC_DEMO_MODE=false in .env.local
 */
export function QuickFillButton({ onFill, label = "Quick Fill (Demo)", disabled = false }: QuickFillButtonProps) {
  // Completely hide button when demo mode is disabled
  if (!isDemoMode()) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onFill}
      disabled={disabled}
      className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
    >
      <Zap className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
