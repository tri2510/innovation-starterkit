"use client";

import { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseStudiesLibrary } from "./case-studies-library";
import { getSession } from "@/lib/session";

interface CaseStudiesButtonProps {
  currentStep?: string;
}

/**
 * Case Studies Button - Opens the Case Studies Library
 *
 * This button can be placed anywhere in the app to give users
 * quick access to real-world success stories for learning and inspiration.
 */
export function CaseStudiesButton({ currentStep }: CaseStudiesButtonProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Get current idea from session for recommendations
  const currentIdea = useMemo(() => {
    const session = getSession();
    if (!session?.selectedIdeaId) return undefined;

    const selectedIdea = session.ideas?.find((i) => i.id === session.selectedIdeaId);
    if (!selectedIdea) return undefined;

    return {
      industry: selectedIdea.searchFields?.industries?.[0],
      businessModel: undefined, // Could be inferred from the idea
    };
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsLibraryOpen(true)}
        className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 h-9 w-auto px-3 shrink-0"
        title="View Case Studies"
        data-action="browse-case-studies"
      >
        <BookOpen className="h-4 w-4 sm:mr-1.5" />
        <span className="hidden sm:inline text-sm">Case Studies</span>
      </Button>

      {isLibraryOpen && (
        <CaseStudiesLibrary
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          currentStep={currentStep}
          currentIdea={currentIdea}
        />
      )}
    </>
  );
}
