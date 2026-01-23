"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { SearchFieldAssignment } from "@/types/innovation";

interface SearchFieldBadgesProps {
  searchFields?: SearchFieldAssignment;
  showReasoning?: boolean;
  compact?: boolean; // Smaller badges for card view
}

// Display names for search fields
const INDUSTRY_LABELS: Record<string, string> = {
  manufacturing: "Manufacturing",
  healthcare: "Healthcare",
  automotive: "Automotive",
  agriculture: "Agriculture",
};

const TECHNOLOGY_LABELS: Record<string, string> = {
  "ai-edge": "AI/Edge AI",
  sdv: "Software-Defined Vehicle",
  robotics: "Robotics",
  virtualization: "Virtualization",
  cloud: "Cloud Computing",
};

const INDUSTRY_ICONS: Record<string, string> = {
  manufacturing: "🏭",
  healthcare: "🏥",
  automotive: "🚗",
  agriculture: "🌾",
};

const TECHNOLOGY_ICONS: Record<string, string> = {
  "ai-edge": "🤖",
  sdv: "🚙",
  robotics: "🦾",
  virtualization: "☁️",
  cloud: "💻",
};

export function SearchFieldBadges({ searchFields, showReasoning = false, compact = false }: SearchFieldBadgesProps) {
  if (!searchFields || (searchFields.industries.length === 0 && searchFields.technologies.length === 0)) {
    return null;
  }

  const badgeSize = compact ? "text-[9px] px-1.5 py-0" : "text-xs px-2 py-0.5";

  return (
    <div className="space-y-2">
      {/* Industries */}
      {searchFields.industries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {searchFields.industries.map((industry) => (
            <TooltipProvider key={industry}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`${badgeSize} border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors`}
                  >
                    <span className="mr-1">{INDUSTRY_ICONS[industry]}</span>
                    {INDUSTRY_LABELS[industry]}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Industry: {INDUSTRY_LABELS[industry]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Technologies */}
      {searchFields.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {searchFields.technologies.map((tech) => (
            <TooltipProvider key={tech}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`${badgeSize} border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors`}
                  >
                    <span className="mr-1">{TECHNOLOGY_ICONS[tech]}</span>
                    {TECHNOLOGY_LABELS[tech]}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Technology: {TECHNOLOGY_LABELS[tech]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Reasoning (optional) */}
      {showReasoning && searchFields.reasoning && (
        <div className="mt-2 p-2 rounded bg-muted/30 border border-border">
          <p className="text-[10px] text-muted-foreground italic">{searchFields.reasoning}</p>
        </div>
      )}
    </div>
  );
}
