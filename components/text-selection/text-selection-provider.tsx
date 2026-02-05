"use client"

import { ReactNode, useState, useCallback, useMemo } from "react";
import { SelectionToolbar } from "./selection-toolbar";
import { EnhancedAnalysisPanel } from "./enhanced-analysis-panel";
import { FloatingCrackButton } from "./floating-crack-button";
import { TextSelectionProvider as BaseTextSelectionProvider, TextSelectionProviderProps, useTextSelection } from "@/hooks/use-text-selection";
import { getSession } from "@/lib/session";

// Helper to get current phase from URL
function getCurrentPhase(): string {
  if (typeof window === "undefined") return "unknown";
  const path = window.location.pathname;
  if (path.includes("/evaluation")) return "evaluation";
  if (path.includes("/challenge")) return "challenge";
  if (path.includes("/market")) return "market";
  if (path.includes("/ideation")) return "ideation";
  if (path.includes("/investment-appraisal")) return "investment-appraisal";
  if (path.includes("/pitch")) return "pitch";
  return "unknown";
}

export function TextSelectionProvider({ children }: Omit<TextSelectionProviderProps, "onSelection">) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const handleAnalyze = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setIsPanelOpen(true);
    }
  }, []);

  const handleDirectChat = useCallback(() => {
    // Check if there's any selected text first
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().trim();

    if (hasSelection) {
      // Use selected text if available (same as popup behavior)
      setSelectedText(selection.toString().trim());
    } else {
      // Empty selection for direct chat mode
      setSelectedText("");
    }
    setIsPanelOpen(true);
  }, []);

  // Get phase context
  const phaseContext = useMemo(() => {
    const phase = getCurrentPhase();
    const sessionData = getSession();

    // Find selected idea from ideas array
    const selectedIdea = sessionData?.selectedIdeaId && sessionData?.ideas
      ? sessionData.ideas.find(i => i.id === sessionData.selectedIdeaId)
      : undefined;

    return {
      phase,
      challenge: sessionData?.challenge,
      market: sessionData?.marketAnalysis,
      idea: selectedIdea,
      appraisal: sessionData?.investmentAppraisal
    };
  }, [isPanelOpen]); // Recalculate when panel opens to get fresh session data

  return (
    <BaseTextSelectionProvider>
      <TextSelectionContextWrapper
        onAnalyze={handleAnalyze}
        onDirectChat={handleDirectChat}
        isPanelOpen={isPanelOpen}
        setIsPanelOpen={setIsPanelOpen}
        selectedText={selectedText}
        phaseContext={phaseContext}
      >
        {children}
      </TextSelectionContextWrapper>
    </BaseTextSelectionProvider>
  );
}

interface TextSelectionContextWrapperProps {
  children: ReactNode;
  onAnalyze: () => void;
  onDirectChat: () => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  selectedText: string;
  phaseContext: {
    phase: string;
    challenge?: any;
    market?: any;
    idea?: any;
    appraisal?: any;
  };
}

function TextSelectionContextWrapper({
  children,
  onAnalyze,
  onDirectChat,
  isPanelOpen,
  setIsPanelOpen,
  selectedText,
  phaseContext
}: TextSelectionContextWrapperProps) {
  const { state } = useTextSelection();

  // Don't show CrackIt features on evaluation page
  const isEvaluationPage = phaseContext.phase === "evaluation";

  return (
    <>
      {children}
      {!isEvaluationPage && (
        <>
          <SelectionToolbar
            position={state.triggerPosition}
            isVisible={state.isVisible}
            onAnalyze={onAnalyze}
          />
          <FloatingCrackButton onClick={onDirectChat} />
          <EnhancedAnalysisPanel
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            selectedText={selectedText}
            phaseContext={phaseContext}
          />
        </>
      )}
    </>
  );
}
