/**
 * Appraisal Section Cards Component
 * Displays appraisal sections in a 3-column grid (like ideate idea cards)
 * Click to expand/select a section for detail view
 */

"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { AppraisalProgressItem } from "@/lib/appraisal-utils";

interface AppraisalSectionCardsProps {
  sections: AppraisalProgressItem[];
  selectedSectionId?: string;
  onSelectSection: (sectionId: string) => void;
  isLoading?: boolean;
}

export function AppraisalSectionCards({
  sections,
  selectedSectionId,
  onSelectSection,
  isLoading = false,
}: AppraisalSectionCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {sections.map((section) => {
        const isSelected = selectedSectionId === section.id;
        const Icon = section.icon;

        return (
          <Card
            key={section.id}
            className={cn(
              "cursor-pointer transition-all overflow-hidden border-2",
              isSelected
                ? "ring-2 ring-purple-500 ring-offset-2 border-purple-300"
                : "border-neutral-200 hover:border-purple-300 hover:shadow-md"
            )}
            onClick={() => onSelectSection(section.id)}
          >
            <div
              className={cn(
                "px-4 py-3 border-b",
                isSelected
                  ? "bg-purple-50 dark:bg-purple-950/30"
                  : "bg-neutral-50 dark:bg-neutral-900/30"
              )}
            >
              <div className="flex items-start gap-2">
                {section.status === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                ) : section.status === "gathering" ? (
                  <Loader2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-neutral-300 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {section.label}
                    </h3>
                    {section.status === "complete" && (
                      <Badge variant="default" className="text-[10px]">
                        Complete
                      </Badge>
                    )}
                    {section.status === "gathering" && (
                      <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-600">
                        Analyzing
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              {section.status === "waiting" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Icon className="h-4 w-4" />
                    <span>Click to generate</span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    AI analysis required for this section
                  </p>
                </div>
              ) : section.status === "gathering" ? (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Icon className="h-4 w-4" />
                  <span>Gathering insights...</span>
                </div>
              ) : (
                <div className="text-sm text-neutral-700 dark:text-neutral-300">
                  {section.excerpt || (
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-green-600" />
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {section.label.toLowerCase()} data available
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
