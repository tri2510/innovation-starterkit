"use client";

import { ReactNode } from "react";
import { ProgressHeader } from "./progress-header";
import { WizardNav } from "./wizard-nav";
import { cn } from "@/lib/utils";

export interface PhaseLayoutProps {
  /** The current wizard step */
  currentStep: string;
  /** Content for the left panel (chat area) */
  leftPanel: ReactNode;
  /** Content for the right panel (progress/content area) */
  rightPanel?: ReactNode;
  /** Width of the left panel in pixels (default: 420px) */
  leftPanelWidth?: number;
  /** Whether to show the right panel (default: true) */
  showRightPanel?: boolean;
  /** Props to pass to ProgressHeader */
  headerProps?: {
    showRestart?: boolean;
    onShowTour?: () => void;
  };
  /** Props to pass to WizardNav (in right panel footer) */
  navProps?: {
    onPrevious?: () => void;
    onNext?: () => void;
    showRestart?: boolean;
    nextLabel?: string;
    isNextDisabled?: boolean;
    isNextLoading?: boolean;
  };
  /** Additional class names for the layout container */
  className?: string;
}

/**
 * PhaseLayout - Consistent layout wrapper for all wizard phases
 *
 * Provides:
 * - ProgressHeader at the top
 * - Split-panel layout (left chat, right content)
 * - WizardNav in right panel footer
 * - Consistent spacing and styling
 *
 * @example
 * ```tsx
 * <PhaseLayout
 *   currentStep="challenge"
 *   leftPanel={<ChatPanel />}
 *   rightPanel={<ProgressPanel />}
 *   navProps={{
 *     onNext: handleContinue,
 *     isNextDisabled: !isComplete,
 *   }}
 * />
 * ```
 */
export function PhaseLayout({
  currentStep,
  leftPanel,
  rightPanel,
  leftPanelWidth = 420,
  showRightPanel = true,
  headerProps,
  navProps,
  className,
}: PhaseLayoutProps) {
  const leftPanelStyle = leftPanelWidth ? { width: `${leftPanelWidth}px` } : undefined;

  return (
    <div className={cn("h-screen flex flex-col bg-background overflow-hidden", className)}>
      {/* Progress Header */}
      <ProgressHeader currentStep={currentStep} {...headerProps} />

      {/* Main Content Area */}
      <main className="flex-1 flex min-h-0 w-full">
        {/* Left Panel - Chat Area */}
        <div
          data-chat-area
          className={cn(
            "flex-shrink-0 border-r bg-muted/10 flex flex-col min-h-0",
            showRightPanel ? "" : "flex-1"
          )}
          style={leftPanelStyle}
        >
          {leftPanel}
        </div>

        {/* Right Panel - Progress/Content Area */}
        {showRightPanel && rightPanel && (
          <div
            data-progress-area
            className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-background to-muted/20"
          >
            {rightPanel}

            {/* WizardNav in footer */}
            {navProps && (
              <div className="flex-shrink-0 border-t bg-background/95 px-4 py-3">
                <WizardNav currentStep={currentStep} {...navProps} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
