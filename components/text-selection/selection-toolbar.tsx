"use client"

import { cn } from "@/lib/utils";
import { CrackItIcon } from "./crack-it-icon";

interface SelectionToolbarProps {
  position: { x: number; y: number } | null;
  isVisible: boolean;
  onAnalyze: () => void;
}

export function SelectionToolbar({ position, isVisible, onAnalyze }: SelectionToolbarProps) {
  if (!isVisible || !position) {
    return null;
  }

  return (
    <div
      data-selection-toolbar
      className="fixed z-50 flex items-center gap-2 rounded-lg bg-popover border shadow-md px-3 py-2 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button
        onClick={onAnalyze}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        aria-label="Analyze with AI"
      >
        <CrackItIcon size={32} />
        Crack It
      </button>
    </div>
  );
}
