"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession, saveMarketAnalysis, saveMarketAnalysisAndContinue, setStep, getConversationHistory, saveConversationHistory } from "@/lib/session";
import type { MarketAnalysis } from "@/types/innovation";
import { DEMO_MARKET_ANALYSIS } from "@/lib/demo-data";
import { InteractiveMarketAnalysis } from "@/components/market/market-interactive";
import { PhaseLayout } from "@/components/wizard";
import { usePhaseState } from "@/hooks";

/**
 * Market Phase Page
 *
 * Second phase of the innovation wizard for market analysis.
 * Uses shared PhaseLayout for consistent architecture,
 * while preserving the custom InteractiveMarketAnalysis component.
 */
export default function MarketPage() {
  const router = useRouter();

  // Ref to track latest marketAnalysis for updates in callbacks
  const marketAnalysisRef = useRef<MarketAnalysis | null>(null);

  // Use shared phase state hook
  const {
    sessionData,
    phaseData: marketAnalysis,
    setPhaseData: setMarketAnalysis,
    messages,
    setMessages,
    isInitialLoad,
    handleQuickFill,
  } = usePhaseState<MarketAnalysis>({
    phase: "market",
    prerequisites: { challenge: true },
    demoData: DEMO_MARKET_ANALYSIS,
    loadConversationHistory: true,
    onDemoFill: (setPhaseData, addMessage) => {
      const demoAnalysis = DEMO_MARKET_ANALYSIS;
      setPhaseData(demoAnalysis);
      saveMarketAnalysis(demoAnalysis);
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "✓ Loaded demo market analysis with TAM, SAM, SOM, trends, and competitors.",
        timestamp: Date.now(),
      });
    },
  });

  // Handle messages change and save to session
  useEffect(() => {
    if (messages.length > 0) {
      saveConversationHistory("market", messages);
    }
  }, [messages]);

  // Auto-save market analysis to session when it changes (including partial updates)
  useEffect(() => {
    if (marketAnalysis && Object.keys(marketAnalysis).length > 0) {
      marketAnalysisRef.current = marketAnalysis;
      saveMarketAnalysis(marketAnalysis);
    }
  }, [marketAnalysis]);

  const challenge = sessionData.challenge;

  const handleSaveMarketAnalysis = (analysis: MarketAnalysis) => {
    setMarketAnalysis(analysis);
    saveMarketAnalysis(analysis);
  };

  const handleContinue = () => {
    if (marketAnalysis) {
      saveMarketAnalysisAndContinue(marketAnalysis);
      router.push("/ideation");
    }
  };

  const handleBack = () => {
    setStep("market");
    router.push("/challenge");
  };

  if (isInitialLoad || !challenge) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Check if market analysis has all required sections (challenges is optional)
  const isMarketAnalysisComplete = marketAnalysis &&
    (marketAnalysis.tam || marketAnalysis.sam || marketAnalysis.som) &&
    marketAnalysis.trends && marketAnalysis.trends.length > 0 &&
    marketAnalysis.competitors && marketAnalysis.competitors.length > 0 &&
    marketAnalysis.opportunities && marketAnalysis.opportunities.length > 0;

  return (
    <PhaseLayout
      currentStep="market"
      showRightPanel={false}
      leftPanel={
        <InteractiveMarketAnalysis
          challenge={challenge}
          marketAnalysis={marketAnalysis}
          setMarketAnalysis={setMarketAnalysis}
          onSaveMarketAnalysis={handleSaveMarketAnalysis}
          onBack={handleBack}
          onContinue={isMarketAnalysisComplete ? handleContinue : undefined}
          isContinueDisabled={!isMarketAnalysisComplete}
          initialMessages={messages}
          onMessagesChange={setMessages}
        />
      }
    />
  );
}
