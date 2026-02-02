/**
 * Appraisal Section Cards Component
 * Displays appraisal sections in a 3-column grid
 * Click to view full detail
 */

"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Loader2, ArrowRight } from "lucide-react";
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
    <div className="grid md:grid-cols-3 gap-3">
      {sections.map((section) => {
        const Icon = section.icon;
        const isSelected = selectedSectionId === section.id;

        return (
          <Card
            key={section.id}
            className={cn(
              "border-2 cursor-pointer transition-all hover:shadow-md",
              isSelected
                ? "ring-2 ring-purple-500 ring-offset-2 border-purple-300"
                : "border-neutral-200 hover:border-purple-200"
            )}
            onClick={() => onSelectSection(section.id)}
          >
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                  {section.status === "complete" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : section.status === "gathering" ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : (
                    <Circle className="h-5 w-5 text-neutral-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
                  {section.excerpt && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {section.excerpt}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Icon className="h-3.5 w-3.5" />
                  <span>View details</span>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
