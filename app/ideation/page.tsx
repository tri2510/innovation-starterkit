"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, saveIdeas, setStep, saveConversationHistory, selectIdea } from "@/lib/session";
import { Lightbulb } from "lucide-react";
import type { Challenge, MarketAnalysis, BusinessIdea, ChatMessage } from "@/types/innovation";
import { DEMO_IDEAS } from "@/lib/demo-data";
import { PhaseLayout } from "@/components/wizard";
import { usePhaseState } from "@/hooks/use-phase-state";
import { InteractiveIdeation } from "@/components/ideation/ideate-interactive";

/**
 * Ideation Phase Page
 *
 * Third phase of the innovation wizard for generating and selecting business ideas.
 * Uses chat-based interaction to generate ideas without scoring during generation.
 * Scoring and detailed analysis moved to Investment Appraisal phase.
 */
export default function IdeationPage() {
  const router = useRouter();

  // Local state for ideation-specific features
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  // Use shared phase state hook (simplified - just for messages and session data)
  const {
    sessionData,
    messages,
    setMessages,
    isInitialLoad,
  } = usePhaseState<ChatMessage>({
    phase: "ideation",
    prerequisites: { challenge: true, marketAnalysis: true },
    getGreetingMessage: (session) => {
      const hasSelection = !!session.selectedIdeaId;
      const hasIdeas = session.ideas && session.ideas.length > 0;

      if (hasSelection) {
        const selected = session.ideas?.find((i: BusinessIdea) => i.id === session.selectedIdeaId);
        return {
          id: "greeting",
          role: "assistant",
          content: `You've selected "${selected?.name}". Cracky here! Ready for investment appraisal?`,
          timestamp: Date.now(),
        };
      } else if (hasIdeas) {
        return {
          id: "greeting",
          role: "assistant",
          content: `Cracky here! I've generated ${session.ideas?.length || 0} innovative ideas. Browse and select your favorite.`,
          timestamp: Date.now(),
        };
      }
      return {
        id: "greeting",
        role: "assistant",
        content: `Hi! I'm Cracky. Ready to generate innovative ideas based on your market analysis?`,
        timestamp: Date.now(),
      };
    },
    demoData: DEMO_IDEAS,
    onDemoFill: (setPhaseData, addMessage) => {
      // Note: setPhaseData is ignored here since we use local ideas state
      // But we keep it for consistency with the hook signature
      setIdeas(DEMO_IDEAS);
      saveIdeas(DEMO_IDEAS);
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `✓ Loaded ${DEMO_IDEAS.length} demo ideas. Click to select your favorite.`,
        timestamp: Date.now(),
      });
    },
  });

  const challenge = sessionData.challenge;
  const marketAnalysis = sessionData.marketAnalysis;

  // Load ideas from session
  useEffect(() => {
    const session = getSession();
    if (session?.ideas && session.ideas.length > 0) {
      setIdeas(session.ideas);
    }
    if (session?.selectedIdeaId) {
      setSelectedIdeaId(session.selectedIdeaId);
    }
  }, []);

  const handleSelectIdea = (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    selectIdea(ideaId);
  };

  const handleBack = () => {
    // Navigate back to market without clearing ideation data
    // Ideas and conversation history are preserved
    setStep("market");
    saveConversationHistory("ideation", messages);
    router.push("/market");
  };

  const handleContinue = () => {
    saveConversationHistory("ideation", messages);

    if (selectedIdeaId) {
      const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);
      if (selectedIdea) {
        localStorage.setItem('selectedInvestment', JSON.stringify(selectedIdea));
      }
    }

    router.push("/investment-appraisal");
  };

  if (isInitialLoad || !challenge || !marketAnalysis) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <Lightbulb className="h-10 w-10 animate-spin text-purple-600" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PhaseLayout
      currentStep="ideation"
      showRightPanel={false}
      leftPanel={
        <InteractiveIdeation
          challenge={challenge}
          marketAnalysis={marketAnalysis}
          ideas={ideas}
          setIdeas={setIdeas}
          selectedIdeaId={selectedIdeaId}
          setSelectedIdeaId={handleSelectIdea}
          onBack={handleBack}
          onContinue={selectedIdeaId ? handleContinue : undefined}
          isContinueDisabled={!selectedIdeaId}
          initialMessages={messages}
          onMessagesChange={setMessages}
        />
      }
    />
  );
}
