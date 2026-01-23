/**
 * Ideation Utility Functions
 * Simplified for idea generation focus (no scoring during generation)
 */

import type { BusinessIdea } from "@/types/innovation";

export type ProgressStatus = "waiting" | "gathering" | "complete";

export interface IdeateProgressItem {
  id: string;
  label: string;
  status: ProgressStatus;
  excerpt?: string;
  ideaCount?: number;
}

// Ideation generation stages - simplified to focus on idea creation
export const defaultIdeateProgress: IdeateProgressItem[] = [
  { id: "exploration", label: "Exploring Concepts", status: "waiting" },
  { id: "divergent", label: "Generating Ideas", status: "waiting" },
  { id: "refinement", label: "Refining Concepts", status: "waiting" },
  { id: "finalization", label: "Finalizing Ideas", status: "waiting" },
];

export function calculateIdeateProgress(items: IdeateProgressItem[]): number {
  const completedCount = items.filter(i => i.status === "complete").length;
  const gatheringCount = items.filter(i => i.status === "gathering").length;
  return Math.round(((completedCount * 100 + gatheringCount * 50) / (items.length * 100)) * 100);
}

export function getIdeateProgressTip(
  overallProgress: number,
  hasIdeas: boolean,
  ideaCount: number,
  isGenerating: boolean
): { text: string; type: string } | null {
  if (hasIdeas && !isGenerating) {
    return { text: `Generated ${ideaCount} innovative ideas. Browse through them, click to select your favorite, or ask me to refine specific concepts.`, type: "success" };
  }
  if (isGenerating) {
    if (overallProgress >= 75) {
      return { text: "Almost there! Finalizing your innovative ideas...", type: "normal" };
    }
    if (overallProgress >= 50) {
      return { text: "Exploring different angles and approaches for your ideas...", type: "normal" };
    }
    if (overallProgress >= 25) {
      return { text: "Analyzing market insights to craft tailored solutions...", type: "normal" };
    }
    return { text: "Brainstorming innovative solutions for your challenge...", type: "normal" };
  }
  return { text: "Ready to generate innovative ideas? Click 'Generate Ideas' or tell me what kind of solutions you're looking for.", type: "normal" };
}
