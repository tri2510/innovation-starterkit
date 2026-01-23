"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Loader2, Check, Sparkles, BarChart3, TrendingUp, Building2, Zap, AlertTriangle, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProgressStatus = "waiting" | "gathering" | "awaiting_confirmation" | "complete";

export interface MarketProgressItem {
  id: string;
  label: string;
  icon?: typeof BarChart3;
  status: ProgressStatus;
  excerpt?: string;
  isOptional?: boolean;
  data?: any; // Market data for this section
}

interface MarketProgressTrackerProps {
  items: MarketProgressItem[];
  overallProgress: number;
  activeSectionId?: string;
  celebrationMessage?: string | null;
}

const iconMap = {
  market_size: BarChart3,
  trends: TrendingUp,
  competitors: Building2,
  opportunities: Zap,
  challenges: AlertTriangle,
};

const requiredSections = ["market_size", "trends", "competitors", "opportunities"];

const getStatusText = (item: MarketProgressItem, hasExcerpt: boolean) => {
  if (item.status === "complete") {
    return "Complete";
  }
  if (item.status === "awaiting_confirmation") {
    return hasExcerpt ? "Ready to confirm ✓" : "Confirming...";
  }
  if (item.status === "gathering") {
    return hasExcerpt ? "Gathering insights..." : `Tell me about ${item.label.toLowerCase()}...`;
  }
  return item.isOptional ? "Optional - share if relevant" : "Waiting to start...";
};

function MarketProgressItemCard({
  item,
  isActive,
}: {
  item: MarketProgressItem;
  isActive?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCrossingOut, setIsCrossingOut] = useState(false);
  const [displayedExcerpt, setDisplayedExcerpt] = useState(item.excerpt || "");
  const [showNewContent, setShowNewContent] = useState(false);
  const prevExcerptRef = useRef<string>("");

  const SectionIcon = iconMap[item.id as keyof typeof iconMap] || Circle;
  const StatusIcon = item.status === "complete" ? CheckCircle2 :
                    item.status === "awaiting_confirmation" ? Check :
                    item.status === "gathering" ? Loader2 :
                    Circle;

  const hasExcerpt = !!item.excerpt;
  const excerptPreview = item.excerpt || "";
  const isLongContent = excerptPreview.length > 150;

  // Smooth cross-out animation when content updates
  useEffect(() => {
    if (item.excerpt && item.excerpt !== prevExcerptRef.current && item.status !== "gathering" && prevExcerptRef.current) {
      setIsCrossingOut(true);
      setTimeout(() => {
        setDisplayedExcerpt(item.excerpt || "");
        setIsCrossingOut(false);
        setShowNewContent(true);
        setIsUpdating(true);
        setTimeout(() => {
          setShowNewContent(false);
          setIsUpdating(false);
        }, 600);
      }, 400);
    } else if (item.excerpt && !prevExcerptRef.current) {
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
      }, 30);
      return () => clearInterval(interval);
    } else if (item.excerpt) {
      setTypedText(item.excerpt);
    }
  }, [item.status, item.excerpt]);

  return (
    <div
      className={cn(
        "border rounded-md p-4 transition-all duration-500 relative overflow-hidden",
        item.status === "complete" && "bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 scale-[1.01] shadow-md",
        item.status === "awaiting_confirmation" && "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 scale-[1.005]",
        item.status === "gathering" && "bg-neutral-50/80 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800",
        item.status === "waiting" && "bg-neutral-50/50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800",
        isActive && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      {/* Shimmer effect during gathering */}
      {item.status === "gathering" && (
        <>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-[shimmer_1.5s_infinite]" />
          </div>
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

      <div className="flex gap-4">
        {/* Left column - Icon, label, status */}
        <div className="w-[200px] flex-shrink-0 flex flex-col">
          <div className="flex items-start gap-2">
            <SectionIcon className={cn(
              "h-5 w-5 mt-0.5 flex-shrink-0 transition-colors",
              item.status === "complete" && "text-green-600 dark:text-green-400",
              item.status === "awaiting_confirmation" && "text-blue-600 dark:text-blue-400",
              item.status === "gathering" && "text-blue-500 dark:text-blue-400",
              item.status === "waiting" && "text-neutral-400 dark:text-neutral-600"
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={cn(
                  "text-sm font-semibold",
                  item.status === "awaiting_confirmation" && "text-blue-900 dark:text-blue-100",
                  item.status === "gathering" && "text-neutral-900 dark:text-neutral-100",
                  item.status === "complete" && "text-neutral-900 dark:text-neutral-100"
                )}>
                  {item.label}
                </p>
                {!item.isOptional && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                )}
              </div>

              <p className={cn(
                "text-xs mt-0.5",
                item.status === "complete" && "text-neutral-600 dark:text-neutral-400",
                item.status === "awaiting_confirmation" && "text-blue-700 dark:text-blue-300",
                item.status === "gathering" && "text-neutral-600 dark:text-neutral-400",
                item.status === "waiting" && "text-neutral-500 dark:text-neutral-500"
              )}>
                {getStatusText(item, hasExcerpt)}
              </p>
            </div>
          </div>
        </div>

        {/* Right column - Excerpt content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {hasExcerpt ? (
            <div
              className={cn(
                "text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 bg-stone-50 dark:bg-stone-950/50 rounded-lg px-3 py-2.5 transition-all font-serif relative",
                !isExpanded && isLongContent && "line-clamp-3"
              )}
              onClick={() => isLongContent && setIsExpanded(!isExpanded)}
              title={isLongContent ? (isExpanded ? "Click to collapse" : "Click to expand") : ""}
            >
              {isUpdating && (
                <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20 animate-pulse pointer-events-none rounded-md -z-10" />
              )}

              {item.status === "gathering" ? (
                <span>
                  {typedText}
                  <span className="inline-block w-0.5 h-4 bg-blue-600 dark:bg-blue-400 ml-1 animate-pulse"></span>
                </span>
              ) : (
                <div className="relative">
                  {isCrossingOut && (
                    <span className={cn(
                      "absolute inset-0 text-neutral-400 dark:text-neutral-600 transition-all duration-300",
                      "line-through decoration-2 decoration-red-400/50 dark:decoration-red-500/50",
                      "animate-cross-out"
                    )}>
                      {displayedExcerpt}
                    </span>
                  )}
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
              {item.status === "waiting" && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center animate-pulse">
                  Waiting for your input...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {item.status === "complete" && (
        <div className="absolute -top-1 -right-1 animate-bounce-in">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-0.5 rounded-md font-medium shadow-sm flex items-center gap-1 animate-pulse-slow">
            <Sparkles className="h-2.5 w-2.5" />
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

export function MarketProgressTracker({
  items,
  overallProgress,
  activeSectionId,
  celebrationMessage,
}: MarketProgressTrackerProps) {
  const completedRequired = items.filter(i => requiredSections.includes(i.id) && i.status === "complete").length;
  const totalRequired = requiredSections.length;
  const completedOptional = items.filter(i => !requiredSections.includes(i.id) && i.status === "complete").length;
  const totalOptional = items.length - totalRequired;

  const getProgressTip = () => {
    if (celebrationMessage) {
      return { icon: CheckCircle2, text: celebrationMessage, type: "celebration" as const };
    }
    if (overallProgress >= 100) {
      return { icon: CheckCircle2, text: "Market analysis complete! Review your findings below.", type: "success" as const };
    }
    if (overallProgress >= 75) {
      return { icon: Sparkles, text: "Great progress! Almost finished with your market analysis.", type: "normal" as const };
    }
    if (overallProgress >= 50) {
      return { icon: Sparkles, text: "Halfway there! Each insight helps build your market intelligence.", type: "normal" as const };
    }
    if (overallProgress >= 25) {
      return { icon: Sparkles, text: "Good start! Let's continue gathering market insights.", type: "normal" as const };
    }
    if (overallProgress > 0) {
      return { icon: Sparkles, text: "Let's begin! Share what you know about your market.", type: "normal" as const };
    }
    return null;
  };

  const progressTip = getProgressTip();

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">
                Market Analysis
              </h3>
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg animate-pulse" />
                </>
              )}
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
          {items.map((item) => (
            <MarketProgressItemCard
              key={item.id}
              item={item}
              isActive={item.id === activeSectionId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
