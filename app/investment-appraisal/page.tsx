"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Sparkles } from "lucide-react";
import { setStep, saveConversationHistory, saveInvestmentAppraisal } from "@/lib/session";
import { DEMO_APPRAISAL } from "@/lib/demo-data";
import type { BusinessIdea } from "@/types/innovation";
import { PhaseLayout } from "@/components/wizard";
import { usePhaseState } from "@/hooks/use-phase-state";
import { InteractiveAppraisal } from "@/components/appraisal/appraisal-interactive";

/**
 * Investment Appraisal Phase Page
 *
 * This phase helps users build a comprehensive appraisal (business idea + financial model merged)
 * for their selected idea. Uses shared PhaseLayout and usePhaseState for consistent architecture.
 */
export default function InvestmentAppraisalPage() {
  const router = useRouter();

  // Local state for appraisal-specific data
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);

  // Use shared phase state hook
  const {
    sessionData,
    phaseData: appraisalData,
    setPhaseData: setAppraisalData,
    messages,
    setMessages,
    isInitialLoad,
    handleQuickFill,
  } = usePhaseState<any>({
    phase: "investment-appraisal",
    prerequisites: { challenge: true, marketAnalysis: true, selectedIdea: true },
    demoData: DEMO_APPRAISAL,
    loadConversationHistory: true,
    onDemoFill: (setPhaseData, addMessage) => {
      setPhaseData(DEMO_APPRAISAL);
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `✓ Loaded complete investment appraisal with 7 sections.\n\n**Financial Highlights:**\n• Total Investment: ${DEMO_APPRAISAL.financialAnalysis?.totalInvestment || "N/A"}\n• 5-Year Revenue: ${DEMO_APPRAISAL.financialAnalysis?.fiveYearRevenue || "N/A"}\n• ROI: ${DEMO_APPRAISAL.financialAnalysis?.roi || "N/A"}\n• Risk Level: ${DEMO_APPRAISAL.riskAssessment?.riskLevel || "N/A"}\n\nReview the details on the right or ask me to explain any section.`,
        timestamp: Date.now(),
      });
    },
  });

  // Handle messages change and save to session
  useEffect(() => {
    if (messages.length > 0) {
      saveConversationHistory("investment-appraisal", messages);
    }
  }, [messages]);

  // Get selected idea from session
  const idea = sessionData.ideas?.find((i: BusinessIdea) => i.id === sessionData.selectedIdeaId) || sessionData.ideas?.[0];
  if (idea && !selectedIdea) {
    setSelectedIdea(idea);
  }

  // Handle save appraisal
  const handleSaveAppraisal = (data: any) => {
    setAppraisalData(data);
    saveInvestmentAppraisal(data);
  };

  // Handle navigation
  const handleBack = () => {
    setStep("investment-appraisal");
    saveConversationHistory("investment-appraisal", messages);
    router.push("/ideation");
  };

  const handleContinue = () => {
    if (appraisalData) {
      const appraisalWithMeta = {
        ...appraisalData,
        ideaId: idea?.id,
        completedAt: new Date().toISOString(),
      };
      saveInvestmentAppraisal(appraisalWithMeta);
      saveConversationHistory("investment-appraisal", messages);
      router.push("/pitch");
    }
  };

  // Show loading state during initial load
  if (isInitialLoad) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Card><CardContent className="flex flex-col items-center justify-center py-16 h-full">
          <Sparkles className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading...</p>
        </CardContent></Card>
      </div>
    );
  }

  const hasAppraisal = !!appraisalData;

  // Guard for missing challenge
  if (!sessionData.challenge) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Challenge data not found. Please go back and define your challenge.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <PhaseLayout
      currentStep="investment-appraisal"
      showRightPanel={false}
      leftPanelWidth={undefined}
      leftPanel={
        <InteractiveAppraisal
          challenge={sessionData.challenge}
          marketAnalysis={sessionData.marketAnalysis}
          selectedIdea={idea ?? null}
          appraisalData={appraisalData}
          setAppraisalData={setAppraisalData}
          onSaveAppraisal={handleSaveAppraisal}
          initialMessages={messages}
          onMessagesChange={setMessages}
          onBack={handleBack}
          onContinue={hasAppraisal ? handleContinue : undefined}
          isContinueDisabled={!hasAppraisal}
        />
      }
    />
  );
}
