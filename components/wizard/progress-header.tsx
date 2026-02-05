"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, RefreshCw, HelpCircle, Download, RotateCcw, MoreVertical, Save, Upload, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "@/types/innovation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearSession, resetPhase, saveStateToFile, loadStateFromFile, getSession } from "@/lib/session";
import { exportSessionToMarkdown } from "@/lib/export-session";
import { useRef, useMemo } from "react";
import { PhaseSummaryTooltip } from "./phase-summary-tooltip";
import { authClient } from "@/lib/auth-client";

interface ProgressHeaderProps {
  currentStep: string;
  showRestart?: boolean;
  onShowTour?: () => void;
}

export function ProgressHeader({ currentStep, showRestart = false, onShowTour }: ProgressHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get session data for tooltips
  const session = useMemo(() => getSession(), []);

  const getCurrentIndex = () => {
    return WIZARD_STEPS.findIndex((step) => step.id === currentStep);
  };

  const currentIndex = getCurrentIndex();
  const stepTitle = WIZARD_STEPS[currentIndex]?.title || "this phase";

  const handleRestart = () => {
    if (confirm("Are you sure you want to start over? This will clear all your progress.")) {
      clearSession();
      window.location.href = "/challenge";
    }
  };

  const handleResetPhase = () => {
    if (confirm(`Are you sure you want to reset ${stepTitle}?\n\nThis will clear:\n- All your answers in this phase\n- The conversation history\n- Progress made in this phase\n\nOther phases will not be affected.`)) {
      resetPhase(currentStep as any);
      // Force a full page reload to ensure React components remount with fresh state
      window.location.reload();
    }
  };

  const handleExport = () => {
    exportSessionToMarkdown();
  };

  const handleSaveState = () => {
    saveStateToFile();
  };

  const handleLoadState = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm("Loading a state file will replace your current session. Are you sure?")) {
        loadStateFromFile(file).catch((error) => {
          console.error("Failed to load state:", error);
        });
      }
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        {/* Logo + Current Step + Progress */}
        <div className="flex items-center gap-4">
          {/* Logo/Brand - Bigger and more visible */}
          <Link href="/" className="flex items-center space-x-3 shrink-0">
            <div className="h-10 w-10 rounded-md bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
              <span className="text-white font-semibold text-base">IK</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight text-neutral-900 dark:text-neutral-100">Innovation StarterKit</span>
              <span className="text-[9px] font-medium text-red-400 dark:text-red-500 uppercase tracking-wide -mt-0.5 text-right">Alpha 3</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Current Step Name - Clear and prominent */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Step {currentIndex + 1} of {WIZARD_STEPS.length}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="font-semibold text-base text-neutral-900 dark:text-neutral-100">{stepTitle}</span>
          </div>

          {/* Progress Bar - takes remaining space */}
          <nav data-progress-bar className="flex-1 flex items-center px-4" aria-label="Progress">
            <div className="w-full flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                {WIZARD_STEPS.map((step, index) => {
                  const isComplete = index < currentIndex;
                  const isCurrent = index === currentIndex;
                  const isAccessible = index <= currentIndex;

                  return (
                    <div key={step.id} className="flex-1 flex flex-col items-center">
                      {isAccessible ? (
                        <PhaseSummaryTooltip phase={step.id as any} session={session}>
                          <Link
                            href={step.path}
                            className="w-full group"
                            title={step.title}
                          >
                            <div
                              className={cn(
                                "h-2 rounded-md transition-all",
                                isCurrent && "bg-blue-600 dark:bg-blue-500",
                                isComplete && "bg-blue-600/70 dark:bg-blue-500/70",
                                !isCurrent && !isComplete && "bg-neutral-200 dark:bg-neutral-800",
                                "hover:bg-blue-500 dark:hover:bg-blue-400"
                              )}
                            />
                          </Link>
                        </PhaseSummaryTooltip>
                      ) : (
                        <div className="w-full">
                          <div className="h-2 rounded-md bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Step labels */}
              <div className="flex items-center gap-1.5">
                {WIZARD_STEPS.map((step, index) => {
                  const isCurrent = index === currentIndex;
                  const isComplete = index < currentIndex;

                  return (
                    <div key={step.id} className="flex-1 text-center">
                      <span
                        className={cn(
                          "text-[10px] font-medium truncate block",
                          isCurrent && "text-blue-600 dark:text-blue-400 font-bold",
                          isComplete && "text-neutral-900 dark:text-neutral-100",
                          !isCurrent && !isComplete && "text-neutral-500 dark:text-neutral-500"
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Help Button */}
          {onShowTour && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowTour}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 h-9 w-9 shrink-0"
              title="Show tour guide"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}

          {/* Hidden file input for loading state */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* More Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 h-9 w-9 shrink-0"
                title="More options"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Reset Phase */}
              <DropdownMenuItem onClick={handleResetPhase}>
                <RotateCcw className="h-4 w-4 mr-2" />
                <span>Reset {stepTitle}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Save State */}
              <DropdownMenuItem onClick={handleSaveState}>
                <Save className="h-4 w-4 mr-2" />
                <span>Save State</span>
              </DropdownMenuItem>

              {/* Load State */}
              <DropdownMenuItem onClick={handleLoadState}>
                <Upload className="h-4 w-4 mr-2" />
                <span>Load State</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Export */}
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                <span>Export as Markdown</span>
              </DropdownMenuItem>

              {/* Restart */}
              {showRestart && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleRestart}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>Restart All</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {/* Logout */}
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
