"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Loader2, AlertCircle, Target, Lightbulb, Users, Building2, Info, Sparkles, ChevronDown, ChevronUp, Edit2, BadgeCheck, ArrowRight, Check, Zap, Clock, Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StrategicFocusSelector, StrategicFocusDisplay } from "@/components/strategic-focus-selector";
import type { SearchFieldAssignment } from "@/types/innovation";

export type ProgressStatus = "pending" | "gathering" | "awaiting_confirmation" | "complete";

export interface ProgressItem {
  id: string;
  label: string;
  icon?: typeof CheckCircle2;
  status: ProgressStatus;
  excerpt?: string;
  isOptional?: boolean;
  strategicFocus?: SearchFieldAssignment; // Special data for strategic focus card
}

interface ProgressTrackerProps {
  items: ProgressItem[];
  overallProgress: number;
  onEdit?: (itemId: string) => void;
  onConfirm?: (itemId: string) => Promise<void>;
  onStrategicFocusChange?: (selection: SearchFieldAssignment) => void;
  activeQuestionId?: string;
  isReviewMode?: boolean;
  currentQuestionNumber?: number;
  totalExpectedQuestions?: number;
  celebrationMessage?: string | null;
  onContinue?: () => void;
}

const iconMap = {
  problem: Lightbulb,
  targetAudience: Users,
  currentSolutions: Target,
  industry: Building2,
  context: Info,
  strategicFocus: Cpu,
};

const requiredFields = ["problem", "targetAudience", "currentSolutions"];

const getStatusText = (item: ProgressItem, hasExcerpt: boolean) => {
  if (item.status === "complete") {
    return "Complete";
  }
  if (item.status === "awaiting_confirmation") {
    return hasExcerpt ? "Ready to confirm ✓" : "Confirming...";
  }
  if (item.status === "gathering") {
    return hasExcerpt ? "Refining details..." : `Tell me about ${item.label.toLowerCase()}...`;
  }
  return item.isOptional ? "Optional - share if relevant" : "Waiting to start...";
};

const getQualityIndicator = (excerpt: string | undefined) => {
  if (!excerpt || typeof excerpt !== "string") return null;
  const wordCount = excerpt.split(/\s+/).length;
  const charCount = excerpt.length;
  // Very short responses are "Too brief"
  if (wordCount < 4 || charCount < 25) {
    return { level: "warning", text: "Too brief", color: "text-orange-600 dark:text-orange-400" };
  }
  // Most normal responses will be "Good"
  if (wordCount < 20 || charCount < 150) {
    return { level: "good", text: "Good", color: "text-blue-600 dark:text-blue-400" };
  }
  // Comprehensive responses are "Detailed"
  return { level: "excellent", text: "Detailed", color: "text-green-600 dark:text-green-400" };
};

const getProgressTip = (
  overallProgress: number,
  isReviewMode: boolean,
  celebrationMessage: string | null | undefined
) => {
  // Celebration message takes priority
  if (celebrationMessage) {
    return { icon: CheckCircle2, text: celebrationMessage, type: "celebration" as const };
  }
  if (isReviewMode) {
    return { icon: BadgeCheck, text: "Review your challenge below, then click 'Analyze Market' to continue.", type: "success" as const };
  }
  if (overallProgress >= 100) {
    return { icon: CheckCircle2, text: "All required fields complete! Review your challenge before continuing.", type: "success" as const };
  }
  if (overallProgress >= 90) {
    return { icon: Sparkles, text: "Nearly there! Just one more piece to finalize your challenge.", type: "normal" as const };
  }
  if (overallProgress >= 75) {
    return { icon: Sparkles, text: "Great progress! Building a solid understanding of your challenge.", type: "normal" as const };
  }
  if (overallProgress >= 50) {
    return { icon: Sparkles, text: "Halfway there! Each detail helps us create better solutions for you.", type: "normal" as const };
  }
  if (overallProgress >= 25) {
    return { icon: Sparkles, text: "Good start! The more specific you are, the better our AI can assist you.", type: "normal" as const };
  }
  if (overallProgress > 0) {
    return { icon: Sparkles, text: "Let's begin! Share what challenge or opportunity you're exploring.", type: "normal" as const };
  }
  return null;
};

function ProgressItemCard({
  item,
  isActive,
  onEdit,
  quality
}: {
  item: ProgressItem;
  isActive?: boolean;
  onEdit?: (itemId: string) => void;
  quality?: ReturnType<typeof getQualityIndicator>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCrossingOut, setIsCrossingOut] = useState(false);
  const [displayedExcerpt, setDisplayedExcerpt] = useState(item.excerpt || "");
  const [showNewContent, setShowNewContent] = useState(false);
  const prevExcerptRef = useRef<string>("");

  const FieldIcon = iconMap[item.id as keyof typeof iconMap] || Circle;
  const StatusIcon = item.status === "complete" ? CheckCircle2 :
                    item.status === "awaiting_confirmation" ? Check :
                    item.status === "gathering" ? Loader2 :
                    Circle;

  const hasExcerpt = !!item.excerpt;
  const excerptPreview = item.excerpt || "";
  const isLongContent = excerptPreview.length > 120;

  // Smooth cross-out animation when content updates
  useEffect(() => {
    if (item.excerpt && item.excerpt !== prevExcerptRef.current && item.status !== "gathering" && prevExcerptRef.current) {
      // Start the cross-out animation
      setIsCrossingOut(true);
      
      // After cross-out completes, show the new content with fade-in
      setTimeout(() => {
        setDisplayedExcerpt(item.excerpt || "");
        setIsCrossingOut(false);
        setShowNewContent(true);
        setIsUpdating(true);
        
        // Clear all animations after transition completes
        setTimeout(() => {
          setShowNewContent(false);
          setIsUpdating(false);
        }, 600);
      }, 400); // Cross-out animation duration
    } else if (item.excerpt && !prevExcerptRef.current) {
      // First time content appears - just show it
      setDisplayedExcerpt(item.excerpt);
    }
    prevExcerptRef.current = item.excerpt || "";
  }, [item.excerpt, item.status]);

  // Typing effect during gathering
  useEffect(() => {
    if (item.status === "gathering" && item.excerpt) {
      setTypedText("");
      let index = 0;
      const text = item.excerpt;
      const interval = setInterval(() => {
        if (index < text.length) {
          setTypedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 30); // Typing speed
      return () => clearInterval(interval);
    } else if (item.excerpt) {
      setTypedText(item.excerpt);
    }
  }, [item.status, item.excerpt]);

  return (
    <div
      className={cn(
        "border rounded-md p-4 transition-all duration-500 relative overflow-hidden h-[140px]",
        // Smooth state transitions with scale effects
        item.status === "complete" && "bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 scale-[1.01] shadow-md",
        item.status === "awaiting_confirmation" && "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 scale-[1.005]",
        item.status === "gathering" && "bg-neutral-50/80 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800",
        item.status === "pending" && "bg-neutral-50/50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800",
        isActive && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      {/* Shimmer effect during gathering */}
      {item.status === "gathering" && (
        <>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-[shimmer_1.5s_infinite]" />
          </div>
          {/* Subtle pulse glow */}
          <div className="absolute inset-0 bg-blue-400/5 animate-pulse pointer-events-none" />
        </>
      )}

      {/* Animated top bar for awaiting confirmation */}
      {item.status === "awaiting_confirmation" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 dark:from-blue-600 dark:via-blue-500 dark:to-blue-600 rounded-md animate-shimmer-bar"></div>
      )}

      {/* Flash effect when content is updated */}
      {isUpdating && (
        <div className="absolute inset-0 border-2 border-blue-400 dark:border-blue-500 rounded-md animate-pulse pointer-events-none -z-10" />
      )}

      {/* Two-column layout for desktop */}
      <div className="flex gap-4 h-full">
        {/* Left column - Icon, label, status, actions */}
        <div className="w-[180px] flex-shrink-0 flex flex-col">
          <div className="flex items-start gap-2">
            <FieldIcon className={cn(
              "h-5 w-5 mt-0.5 flex-shrink-0 transition-colors",
              item.status === "complete" && "text-green-600 dark:text-green-400",
              item.status === "awaiting_confirmation" && "text-blue-600 dark:text-blue-400",
              item.status === "gathering" && "text-blue-500 dark:text-blue-400",
              item.status === "pending" && "text-neutral-400 dark:text-neutral-600"
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={cn(
                  "text-sm font-semibold truncate",
                  item.status === "awaiting_confirmation" && "text-blue-900 dark:text-blue-100",
                  item.status === "gathering" && "text-neutral-900 dark:text-neutral-100",
                  item.status === "complete" && "text-neutral-900 dark:text-neutral-100"
                )}>
                  {item.label}
                </p>

                {/* Required indicator */}
                {!item.isOptional && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" aria-label="Required" />
                )}
              </div>

              <p className={cn(
                "text-xs mt-0.5 truncate",
                item.status === "complete" && "text-neutral-600 dark:text-neutral-400",
                item.status === "awaiting_confirmation" && "text-blue-700 dark:text-blue-300",
                item.status === "gathering" && "text-neutral-600 dark:text-neutral-400",
                item.status === "pending" && "text-neutral-500 dark:text-neutral-500"
              )}>
                {getStatusText(item, hasExcerpt)}
              </p>

              {item.status === "complete" && quality && (
                <div className="mt-1">
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800", quality.color)}>
                    {quality.text}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto flex items-center gap-1.5 flex-wrap">
            {/* Show Edit button if: has excerpt OR status is gathering (non-pending fields with active work) */}
            {onEdit && (hasExcerpt || item.status === "gathering") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => onEdit(item.id)}
              >
                <Edit2 className="h-2.5 w-2.5 mr-0.5" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Right column - Excerpt content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {hasExcerpt ? (
            <div
              className={cn(
                "text-base leading-relaxed font-medium text-neutral-900 dark:text-neutral-100 bg-stone-50 dark:bg-stone-950/50 rounded-lg px-3 py-2.5 h-full overflow-y-auto transition-all font-serif relative",
                !isExpanded && isLongContent && "line-clamp-4"
              )}
              onClick={() => isLongContent && setIsExpanded(!isExpanded)}
              title={isLongContent ? (isExpanded ? "Click to collapse" : "Click to expand") : ""}
            >
              {/* Update flash effect */}
              {isUpdating && (
                <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20 animate-pulse pointer-events-none rounded-md -z-10" />
              )}

              {/* Typing effect during gathering */}
              {item.status === "gathering" ? (
                <span>
                  {typedText}
                  <span className="inline-block w-0.5 h-4 bg-blue-600 dark:bg-blue-400 ml-1 animate-pulse"></span>
                </span>
              ) : (
                <div className="relative">
                  {/* Old content with cross-out animation */}
                  {isCrossingOut && (
                    <span className={cn(
                      "absolute inset-0 text-neutral-400 dark:text-neutral-600 transition-all duration-300",
                      "line-through decoration-2 decoration-red-400/50 dark:decoration-red-500/50",
                      "animate-cross-out"
                    )}>
                      {displayedExcerpt}
                    </span>
                  )}
                  
                  {/* New content with fade-in */}
                  <span className={cn(
                    "transition-all duration-500",
                    showNewContent ? "animate-fade-in opacity-100" : "opacity-100",
                    isCrossingOut && "opacity-0"
                  )}>
                    {displayedExcerpt}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              {item.status === "gathering" && (
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <p className="text-xs">Listening to your response...</p>
                </div>
              )}
              {item.status === "pending" && (
                <div className="relative">
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center animate-pulse">
                    Waiting for your input...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expand hint for long content */}
      {hasExcerpt && isLongContent && !isExpanded && (
        <div className="absolute bottom-2 right-2 text-[10px] text-neutral-400 dark:text-neutral-600 flex items-center gap-0.5">
          <span>Click to expand</span>
        </div>
      )}

      {item.status === "complete" && (
        <div className="absolute -top-1 -right-1 animate-bounce-in">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-0.5 rounded-md font-medium shadow-sm flex items-center gap-1 animate-pulse-slow">
            <Zap className="h-2.5 w-2.5" />
            Done
          </div>
        </div>
      )}

      {item.status === "awaiting_confirmation" && (
        <div className="absolute -top-1 -right-1 animate-pulse">
          <div className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-md font-medium shadow-sm flex items-center gap-1">
            <Check className="h-2.5 w-2.5" />
            Confirm
          </div>
        </div>
      )}

      {/* Updated indicator - shows briefly when content changes */}
      {isUpdating && (
        <div className="absolute -bottom-1 -right-1 animate-bounce-in">
          <div className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-sm flex items-center gap-0.5">
            <Sparkles className="h-2 w-2" />
            Updated
          </div>
        </div>
      )}
    </div>
  );
}

// Special card for Strategic Focus selection
function StrategicFocusCard({
  item,
  isActive,
  onStrategicFocusChange,
}: {
  item: ProgressItem;
  isActive?: boolean;
  onStrategicFocusChange?: (selection: SearchFieldAssignment) => void;
}) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const FieldIcon = iconMap["strategicFocus"] || Cpu;
  const hasSelection = item.strategicFocus &&
    (item.strategicFocus.industries.length > 0 || item.strategicFocus.technologies.length > 0);

  const handleSaveSelection = (selection: SearchFieldAssignment) => {
    onStrategicFocusChange?.(selection);
    setIsSelectorOpen(false);
  };

  const handleCancelSelection = () => {
    setIsSelectorOpen(false);
  };

  const handleClick = () => {
    setIsSelectorOpen(true);
  };

  return (
    <div
      className={cn(
        "border rounded-md transition-all duration-300 relative overflow-hidden",
        item.status === "complete" && "bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 scale-[1.01] shadow-md",
        item.status === "pending" && "bg-neutral-50/50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800",
        isActive && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      {isSelectorOpen ? (
        // Selector interface
        <StrategicFocusSelector
          initialSelection={item.strategicFocus}
          onSave={handleSaveSelection}
          onCancel={handleCancelSelection}
        />
      ) : (
        // Display interface
        <div className="p-4">
          <div className="flex gap-4">
            {/* Left column - Icon, label, status, actions */}
            <div className="w-[180px] flex-shrink-0 flex flex-col">
              <div className="flex items-start gap-2">
                <FieldIcon className={cn(
                  "h-5 w-5 mt-0.5 flex-shrink-0 transition-colors",
                  item.status === "complete" ? "text-green-600 dark:text-green-400" : "text-neutral-400 dark:text-neutral-600"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={cn(
                      "text-sm font-semibold",
                      item.status === "complete" && "text-neutral-900 dark:text-neutral-100"
                    )}>
                      Strategic Focus
                    </p>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 flex-shrink-0" aria-label="Optional" />
                  </div>

                  <p className={cn(
                    "text-xs mt-0.5",
                    item.status === "complete" ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-500 dark:text-neutral-500"
                  )}>
                    {hasSelection ? "Selected" : "Optional - select strategic areas"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex items-center gap-1.5">
                <Button
                  variant={hasSelection ? "ghost" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={handleClick}
                >
                  {hasSelection ? (
                    <>
                      <Edit2 className="h-2.5 w-2.5 mr-0.5" />
                      Edit
                    </>
                  ) : (
                    "Select"
                  )}
                </Button>
              </div>
            </div>

            {/* Right column - Display */}
            <div className="flex-1 min-w-0 flex items-center">
              {hasSelection && item.strategicFocus ? (
                <StrategicFocusDisplay selection={item.strategicFocus} />
              ) : (
                <p className="text-sm text-neutral-400 dark:text-neutral-600 italic">
                  Select industries and technologies that align with your innovation...
                </p>
              )}
            </div>
          </div>

          {item.status === "complete" && (
            <div className="absolute -top-1 -right-1 animate-bounce-in">
              <div className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-md font-medium shadow-sm flex items-center gap-1">
                <Zap className="h-2.5 w-2.5" />
                Done
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProgressTracker({
  items,
  overallProgress,
  onEdit,
  onStrategicFocusChange,
  activeQuestionId,
  isReviewMode = false,
  currentQuestionNumber,
  totalExpectedQuestions,
  celebrationMessage,
  onContinue,
}: ProgressTrackerProps) {
  const progressTip = getProgressTip(overallProgress, isReviewMode, celebrationMessage);

  const completedRequired = items.filter(i => requiredFields.includes(i.id) && i.status === "complete").length;
  const totalRequired = requiredFields.length;
  const completedOptional = items.filter(i => !requiredFields.includes(i.id) && i.status === "complete").length;
  const totalOptional = items.length - totalRequired;

  // In review mode, use the same Card layout for consistency
  if (isReviewMode && overallProgress >= 100) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">
                  Your Challenge
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {completedRequired}/{totalRequired} required
                  {completedOptional > 0 && ` · ${completedOptional}/${totalOptional} optional`}
                </span>
                <Badge className="bg-green-600 text-white border-0">100%</Badge>
              </div>
            </div>

            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Success message */}
          <div className="mb-4 flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
            <BadgeCheck className="h-4 w-4 flex-shrink-0 animate-pulse" />
            <span className="font-medium">Review captured info, then click "Analyze Market" to continue.</span>
          </div>

          <div className="space-y-3">
            {items.map((item) =>
              item.id === "strategicFocus" ? (
                <StrategicFocusCard
                  key={item.id}
                  item={item}
                  onStrategicFocusChange={onStrategicFocusChange}
                />
              ) : (
                <ProgressItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  quality={getQualityIndicator(item.excerpt)}
                />
              )
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">
                {isReviewMode ? "Review Your Challenge" : "Defining Your Challenge"}
              </h3>
              {!isReviewMode && currentQuestionNumber && totalExpectedQuestions && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                  Question {currentQuestionNumber} of ~{totalExpectedQuestions}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {completedRequired}/{totalRequired} required
                {completedOptional > 0 && ` · ${completedOptional}/${totalOptional} optional`}
              </span>
              <span className="text-sm font-medium">{Math.round(overallProgress)}% complete</span>
            </div>
          </div>

          <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
            <div
              className={cn(
                "h-full transition-all duration-700 ease-out relative rounded-full",
                overallProgress >= 100 ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-blue-500 to-blue-600"
              )}
              style={{ width: `${overallProgress}%` }}
            >
              {overallProgress > 0 && overallProgress < 100 && (
                <>
                  {/* Shimmer effect on progress bar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  {/* Glowing leading edge */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg animate-pulse" />
                </>
              )}
              {/* Sparkle at 100% */}
              {overallProgress >= 100 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Sparkles className="h-3 w-3 text-white animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {progressTip && (
          <div className={cn(
            "mb-4 flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-all",
            progressTip.type === "celebration" && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800",
            progressTip.type === "success" && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
            progressTip.type !== "success" && progressTip.type !== "celebration" && overallProgress >= 75 && "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
            progressTip.type !== "success" && progressTip.type !== "celebration" && overallProgress < 75 && "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          )}>
            <progressTip.icon className={cn(
              "h-4 w-4 flex-shrink-0",
              (progressTip.type === "success" || progressTip.type === "celebration" || overallProgress >= 75) && "animate-pulse"
            )} />
            <span className="font-medium">{progressTip.text}</span>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) =>
            item.id === "strategicFocus" ? (
              <StrategicFocusCard
                key={item.id}
                item={item}
                isActive={item.id === activeQuestionId}
                onStrategicFocusChange={onStrategicFocusChange}
              />
            ) : (
              <ProgressItemCard
                key={item.id}
                item={item}
                isActive={item.id === activeQuestionId}
                onEdit={onEdit}
                quality={getQualityIndicator(item.excerpt)}
              />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
