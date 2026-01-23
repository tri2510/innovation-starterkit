/**
 * Market Progress Components
 * Market-specific UI elements for tracking market analysis progress
 */

import { BarChart3, TrendingUp, Users, Zap, AlertTriangle, Check, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MarketProgressItem {
  id: string;
  label: string;
  icon?: any;
  status: "waiting" | "gathering" | "awaiting_confirmation" | "complete";
  excerpt?: string;
  isOptional?: boolean;
}

export function MarketSizeProgressCard({ item, isActive }: { item: MarketProgressItem; isActive?: boolean }) {
  const hasData = item.excerpt && item.status !== "waiting";

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-300",
      item.status === "complete" && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
      item.status === "gathering" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "awaiting_confirmation" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "waiting" && "bg-neutral-50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800",
      isActive && "ring-2 ring-blue-500"
    )}>
      <div className="flex items-start gap-3">
        <BarChart3 className={cn(
          "h-5 w-5 flex-shrink-0 mt-0.5",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-500 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-blue-600 dark:text-blue-400",
          item.status === "waiting" && "text-neutral-400 dark:text-neutral-600"
        )} />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">Market Size Analysis</p>
            {!item.isOptional && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
          </div>

          <p className={cn(
            "text-xs mb-2",
            item.status === "complete" && "text-green-700 dark:text-green-300",
            item.status === "gathering" && "text-blue-700 dark:text-blue-300",
            item.status === "awaiting_confirmation" && "text-blue-700 dark:text-blue-300",
            item.status === "waiting" && "text-neutral-500 dark:text-neutral-500"
          )}>
            {item.status === "complete" ? "Analysis Complete" :
             item.status === "gathering" ? "Gathering market estimates..." :
             item.status === "awaiting_confirmation" ? "Please confirm market analysis" :
             "Waiting to start..."}
          </p>

          {hasData ? (
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">{item.excerpt}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-stone-50 dark:bg-stone-950 rounded p-2">
                  <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">TAM</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">$X B</p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-950 rounded p-2">
                  <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">SAM</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">$Y B</p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-950 rounded p-2">
                  <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">SOM</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">$Z B</p>
                </div>
              </div>
            </div>
          ) : item.status === "gathering" && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <p className="text-xs">Analyzing market size...</p>
            </div>
          )}
        </div>

        {item.status === "complete" && (
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function TrendsProgressCard({ item, isActive }: { item: MarketProgressItem; isActive?: boolean }) {
  const hasData = item.excerpt && item.status !== "waiting";
  const trendCount = item.excerpt?.match(/\d+/)?.[0] || "0";

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-300",
      item.status === "complete" && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
      item.status === "gathering" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "awaiting_confirmation" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "waiting" && "bg-neutral-50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800",
      isActive && "ring-2 ring-blue-500"
    )}>
      <div className="flex items-start gap-3">
        <TrendingUp className={cn(
          "h-5 w-5 flex-shrink-0 mt-0.5",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-500 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-blue-600 dark:text-blue-400",
          item.status === "waiting" && "text-neutral-400 dark:text-neutral-600"
        )} />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">Market Trends</p>
            {!item.isOptional && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
          </div>

          <p className={cn(
            "text-xs mb-2",
            item.status === "complete" && "text-green-700 dark:text-green-300",
            item.status === "gathering" && "text-blue-700 dark:text-blue-300",
            item.status === "awaiting_confirmation" && "text-blue-700 dark:text-blue-300",
            item.status === "waiting" && "text-neutral-500 dark:text-neutral-500"
          )}>
            {item.status === "complete" ? `${trendCount} trends identified` :
             item.status === "gathering" ? "Analyzing market trends..." :
             item.status === "awaiting_confirmation" ? "Please confirm trend analysis" :
             "Waiting to start..."}
          </p>

          {hasData && item.status === "complete" && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />Rising
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <span className="h-3 w-3 mr-1">→</span>Stable
              </Badge>
            </div>
          )}
        </div>

        {item.status === "complete" && (
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function CompetitorsProgressCard({ item, isActive }: { item: MarketProgressItem; isActive?: boolean }) {
  const hasData = item.excerpt && item.status !== "waiting";
  const competitorCount = item.excerpt?.match(/\d+/)?.[0] || "0";

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-300",
      item.status === "complete" && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
      item.status === "gathering" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "awaiting_confirmation" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "waiting" && "bg-neutral-50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800",
      isActive && "ring-2 ring-blue-500"
    )}>
      <div className="flex items-start gap-3">
        <Users className={cn(
          "h-5 w-5 flex-shrink-0 mt-0.5",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-500 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-blue-600 dark:text-blue-400",
          item.status === "waiting" && "text-neutral-400 dark:text-neutral-600"
        )} />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">Competitive Landscape</p>
            {!item.isOptional && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
          </div>

          <p className={cn(
            "text-xs mb-2",
            item.status === "complete" && "text-green-700 dark:text-green-300",
            item.status === "gathering" && "text-blue-700 dark:text-blue-300",
            item.status === "awaiting_confirmation" && "text-blue-700 dark:text-blue-300",
            item.status === "waiting" && "text-neutral-500 dark:text-neutral-500"
          )}>
            {item.status === "complete" ? `${competitorCount} competitors analyzed` :
             item.status === "gathering" ? "Analyzing competitive landscape..." :
             item.status === "awaiting_confirmation" ? "Please confirm competitor analysis" :
             "Waiting to start..."}
          </p>

          {hasData && item.status === "complete" && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />Strengths
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <span className="h-3 w-3 mr-1">×</span>Weaknesses
              </Badge>
            </div>
          )}
        </div>

        {item.status === "complete" && (
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function OpportunitiesProgressCard({ item, isActive }: { item: MarketProgressItem; isActive?: boolean }) {
  const hasData = item.excerpt && item.status !== "waiting";
  const opportunityCount = item.excerpt?.match(/\d+/)?.[0] || "0";

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-300",
      item.status === "complete" && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
      item.status === "gathering" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "awaiting_confirmation" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "waiting" && "bg-neutral-50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800",
      isActive && "ring-2 ring-blue-500"
    )}>
      <div className="flex items-start gap-3">
        <Zap className={cn(
          "h-5 w-5 flex-shrink-0 mt-0.5",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-500 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-blue-600 dark:text-blue-400",
          item.status === "waiting" && "text-neutral-400 dark:text-neutral-600"
        )} />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">Market Opportunities</p>
            {!item.isOptional && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
          </div>

          <p className={cn(
            "text-xs mb-2",
            item.status === "complete" && "text-green-700 dark:text-green-300",
            item.status === "gathering" && "text-blue-700 dark:text-blue-300",
            item.status === "awaiting_confirmation" && "text-blue-700 dark:text-blue-300",
            item.status === "waiting" && "text-neutral-500 dark:text-neutral-500"
          )}>
            {item.status === "complete" ? `${opportunityCount} opportunities identified` :
             item.status === "gathering" ? "Identifying market opportunities..." :
             item.status === "awaiting_confirmation" ? "Please confirm opportunity analysis" :
             "Waiting to start..."}
          </p>

          {hasData && item.status === "complete" && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium">High-potential opportunities</span>
            </div>
          )}
        </div>

        {item.status === "complete" && (
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ChallengesProgressCard({ item, isActive }: { item: MarketProgressItem; isActive?: boolean }) {
  const hasData = item.excerpt && item.status !== "waiting";

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-300",
      item.status === "complete" && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
      item.status === "gathering" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "awaiting_confirmation" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      item.status === "waiting" && "bg-neutral-50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800 border-dashed",
      isActive && "ring-2 ring-blue-500"
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn(
          "h-5 w-5 flex-shrink-0 mt-0.5",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-500 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-blue-600 dark:text-blue-400",
          item.status === "waiting" && "text-neutral-400 dark:text-neutral-600"
        )} />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">Market Challenges</p>
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
            <span className="text-[10px] text-neutral-500">(Optional)</span>
          </div>

          <p className={cn(
            "text-xs mb-2",
            item.status === "complete" && "text-green-700 dark:text-green-300",
            item.status === "gathering" && "text-blue-700 dark:text-blue-300",
            item.status === "awaiting_confirmation" && "text-blue-700 dark:text-blue-300",
            item.status === "waiting" && "text-neutral-500 dark:text-neutral-500"
          )}>
            {item.status === "complete" ? "Challenges identified" :
             item.status === "gathering" ? "Analyzing market challenges..." :
             item.status === "awaiting_confirmation" ? "Please confirm challenges" :
             "Optional - discuss if relevant"}
          </p>
        </div>

        {item.status === "complete" && (
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}