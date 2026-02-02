"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, setStep, savePitchDeck, getConversationHistory, saveConversationHistory, clearSession } from "@/lib/session";
import { exportSessionToPDF } from "@/lib/export-pdf";
import { DEMO_PITCH_DECK } from "@/lib/demo-data";
import type { PitchDeck, Challenge, MarketAnalysis, BusinessIdea, DetailedIdeaMetrics, ChatMessage } from "@/types/innovation";
import { PhaseLayout } from "@/components/wizard";
import { PhaseChat } from "@/components/chat";
import { usePhaseState } from "@/hooks";
import { streamChatResponse } from "@/hooks/use-chat-streaming";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronLeft, ChevronRight, Sparkles, RefreshCw, Presentation, ChevronDown, ChevronUp, Target, TrendingUp, Lightbulb as IdeaIcon, DollarSign } from "lucide-react";

// Collapsible Review Summary Component
interface CollapsibleReviewSummaryProps {
  challenge?: Challenge;
  marketAnalysis?: MarketAnalysis;
  selectedIdea?: BusinessIdea;
}

function CollapsibleReviewSummary({ challenge, marketAnalysis, selectedIdea }: CollapsibleReviewSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to extract numeric score from metrics (handles both legacy and detailed)
  const getMetricScore = (metrics: any, key: string): number => {
    if (!metrics) return 0;

    // Check if metrics are detailed
    const isDetailed = metrics && "overallScore" in metrics && "problemClarity" in metrics;

    if (isDetailed) {
      // Map legacy keys to detailed metrics
      const keyMap: Record<string, string> = {
        marketFit: "marketFit",
        feasibility: "financialViability", // Use financial viability as proxy for feasibility
        innovation: "innovation",
      };
      const detailedKey = keyMap[key] || key;
      const criterion = metrics[detailedKey];
      return criterion?.score ?? 0;
    }

    // Legacy metrics
    return metrics[key] ?? 0;
  };

  // Check if metrics are detailed
  const isDetailedMetrics = (metrics: any): metrics is DetailedIdeaMetrics => {
    return metrics && "overallScore" in metrics && "problemClarity" in metrics;
  };

  // Get ROI from metrics
  const getROI = (metrics: any): string => {
    if (isDetailedMetrics(metrics)) {
      return metrics.roi || "medium";
    }
    return metrics.roi || "medium";
  };

  return (
    <div className="border-b border-slate-100">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Review Summary</h3>
            <p className="text-xs text-slate-500">Your approved business concept</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Challenge Summary */}
          {challenge && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-slate-600" />
                <h4 className="font-semibold text-slate-900 text-sm">The Challenge</h4>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <div>
                  <span className="font-medium">Problem:</span>
                  <p className="mt-1">{challenge.problem}</p>
                </div>
                <div>
                  <span className="font-medium">Target Audience:</span>
                  <p className="mt-1">{challenge.targetAudience}</p>
                </div>
              </div>
            </div>
          )}

          {/* Market Analysis Summary */}
          {marketAnalysis && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-slate-600" />
                <h4 className="font-semibold text-slate-900 text-sm">Market Opportunity</h4>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded p-2 text-center">
                    <div className="text-xs text-slate-500">TAM</div>
                    <div className="font-medium text-xs">{marketAnalysis.tam?.split('(')[0]?.trim()}</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="text-xs text-slate-500">SAM</div>
                    <div className="font-medium text-xs">{marketAnalysis.sam?.split('(')[0]?.trim()}</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="text-xs text-slate-500">SOM</div>
                    <div className="font-medium text-xs">{marketAnalysis.som?.split('(')[0]?.trim()}</div>
                  </div>
                </div>
                {marketAnalysis.trends && marketAnalysis.trends.length > 0 && (
                  <div>
                    <span className="font-medium">Key Trends:</span>
                    <ul className="mt-1 space-y-1">
                      {marketAnalysis.trends.slice(0, 2).map((trend, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span className="text-xs">{trend.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            trend.momentum === 'rising' ? 'bg-green-100 text-green-700' :
                            trend.momentum === 'stable' ? 'bg-slate-100 text-slate-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {trend.momentum}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Idea Summary */}
          {selectedIdea && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <IdeaIcon className="h-4 w-4 text-slate-600" />
                <h4 className="font-semibold text-slate-900 text-sm">{selectedIdea.name}</h4>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="italic text-slate-600">"{selectedIdea.tagline}"</p>
                <p>{selectedIdea.description}</p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-slate-500">Market Fit</div>
                    <div className="font-semibold text-slate-900">{selectedIdea.metrics ? getMetricScore(selectedIdea.metrics, "marketFit") : "—"}/100</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-slate-500">Feasibility</div>
                    <div className="font-semibold text-slate-900">{selectedIdea.metrics ? getMetricScore(selectedIdea.metrics, "feasibility") : "—"}/100</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Slide Viewer Component
interface SlideViewerProps {
  pitchDeck: PitchDeck;
  currentSlideIndex: number;
  onPreviousSlide: () => void;
  onNextSlide: () => void;
  onSelectSlide: (index: number) => void;
}

function SlideViewer({ pitchDeck, currentSlideIndex, onPreviousSlide, onNextSlide, onSelectSlide }: SlideViewerProps) {
  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-md bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
            <Presentation className="h-5 w-5 text-slate-100" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{pitchDeck.title}</h1>
            <p className="text-sm text-slate-600">{pitchDeck.tagline}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousSlide}
            disabled={currentSlideIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-600 min-w-[80px] text-center">
            Slide {currentSlideIndex + 1} of {pitchDeck.slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextSlide}
            disabled={currentSlideIndex === pitchDeck.slides.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="aspect-video relative">
              <div className="absolute inset-0 bg-white text-slate-900 p-10 flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold uppercase tracking-wide">
                      {pitchDeck.slides[currentSlideIndex].type}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 line-clamp-3">{pitchDeck.slides[currentSlideIndex].title}</h2>
                  <div className="space-y-3 md:space-y-4">
                    {Object.entries(pitchDeck.slides[currentSlideIndex].content).slice(0, 6).map(([key, value]) => (
                      <div key={key}>
                        {typeof value === "string" && (
                          <p className="text-base md:text-lg leading-relaxed break-words">{value}</p>
                        )}
                        {Array.isArray(value) && (
                          <ul className="space-y-1.5 md:space-y-2">
                            {value.slice(0, 6).map((item, i) => (
                              <li key={i} className="flex items-start gap-2 md:gap-3 text-base md:text-lg">
                                <span className="h-2 w-2 rounded-full bg-slate-900 mt-2 md:mt-2.5 flex-shrink-0" />
                                <span className="break-words line-clamp-2">{typeof item === "object" ? JSON.stringify(item) : item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {typeof value === "object" && value !== null && !Array.isArray(value) && (
                          <div className="space-y-2">
                            {Object.entries(value).slice(0, 4).map(([objKey, objValue]) => (
                              <div key={objKey} className="text-base md:text-lg">
                                <span className="font-semibold">{objKey}:</span>{" "}
                                <span className="break-words line-clamp-2">{typeof objValue === "object" ? JSON.stringify(objValue) : String(objValue)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slide Thumbnails Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">All Slides</h3>
          <span className="text-xs text-slate-500">Click to jump to slide</span>
        </div>
        <div className="flex gap-3 overflow-x-auto py-8 px-2 items-center">
          {pitchDeck.slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => onSelectSlide(index)}
              className={`flex-shrink-0 rounded-lg border-2 snap-start transition-all duration-200 origin-center ${
                index === currentSlideIndex
                  ? "w-36 h-28 border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg scale-110 z-10"
                  : "w-36 h-28 border-slate-200 bg-gradient-to-br from-white to-slate-50 opacity-70 hover:opacity-100 hover:shadow-md hover:border-slate-300 hover:scale-105"
              } flex flex-col p-2.5 pt-1.5 text-left relative`}
            >
              <div className={`absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                index === currentSlideIndex
                  ? "bg-slate-800 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 flex flex-col justify-center py-1">
                <span
                  className="text-slate-900 text-xs font-semibold block line-clamp-2 leading-tight"
                  title={slide.title}
                >
                  {slide.title}
                </span>
                <span className="text-slate-500 text-[9px] uppercase tracking-wide font-medium mt-1">
                  {slide.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <Presentation className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{pitchDeck.slides.length} Slides</h3>
                <p className="text-xs text-slate-600">Ready to present</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Professional pitch deck covering problem, solution, market, and business model.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="pt-6 space-y-3">
            <Button
              onClick={() => exportSessionToPDF()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 mb-3">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold mb-1 text-slate-900">Congratulations!</h3>
              <p className="text-sm text-slate-600 mb-4">
                You've completed the innovation journey
              </p>
              <Button
                onClick={() => {
                  if (confirm("Start over? This will clear all your progress.")) {
                    clearSession();
                    window.location.href = "/challenge";
                  }
                }}
                variant="outline"
                size="sm"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Start New Journey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Pitch Phase Page
 *
 * Final phase of the innovation wizard for pitch deck generation.
 * Uses shared PhaseLayout and usePhaseState for consistent architecture,
 * while preserving custom pitch deck slide navigation and review summary.
 */
export default function PitchPage() {
  const router = useRouter();
  const [pitchDeck, setPitchDeck] = useState<PitchDeck | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isReviewSummaryExpanded, setIsReviewSummaryExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Use shared phase state hook
  const {
    sessionData,
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading: isChatLoading,
    setIsLoading: setIsChatLoading,
    addMessage,
    isInitialLoad,
    handleQuickFill,
  } = usePhaseState({
    phase: "pitch",
    prerequisites: { challenge: true, selectedIdeaId: true, ideas: true },
    loadConversationHistory: true,
    demoData: DEMO_PITCH_DECK,
    onDemoFill: (setPhaseData, addMessage) => {
      setPitchDeck(DEMO_PITCH_DECK);
      setHasGenerated(true);
      savePitchDeck(DEMO_PITCH_DECK);
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `✓ Loaded demo pitch deck "${DEMO_PITCH_DECK.title}" with ${DEMO_PITCH_DECK.slides.length} slides.`,
        timestamp: Date.now(),
      });
    },
  });

  const selectedIdea = sessionData.ideas?.find((i: any) => i.id === sessionData.selectedIdeaId) || sessionData.ideas?.[0];

  // Handle messages change and save to session
  useEffect(() => {
    if (messages.length > 0) {
      saveConversationHistory("pitch", messages);
    }
  }, [messages]);

  // Load existing pitch deck from session
  useEffect(() => {
    if (sessionData.pitchDeck) {
      setPitchDeck(sessionData.pitchDeck);
      setHasGenerated(true);
    }
  }, [sessionData]);

  // Generate welcome message if none exists
  useEffect(() => {
    // Only add welcome message if truly empty (no messages at all)
    if (!isInitialLoad && messages.length === 0 && !hasGenerated && !pitchDeck) {
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm ready to help you generate a professional pitch deck! Click the \"Generate Pitch Deck\" button below when you're ready, or ask me any questions about the process.",
        timestamp: Date.now(),
      });
    }
    // Only add "pitch deck ready" message if we have a pitch deck but no messages
    // This prevents duplicate messages when refreshing after generation
    if (hasGenerated && pitchDeck && messages.length === 0) {
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `Your pitch deck "${pitchDeck.title}" is ready! You can navigate through slides on the right, download as PDF, or ask me to help refine specific slides or content.`,
        timestamp: Date.now(),
      });
    }
  }, [isInitialLoad, hasGenerated, pitchDeck]);

  // Navigate back
  const handleBack = () => {
    saveConversationHistory("pitch", messages);
    setStep("ideation");
    router.push("/ideation");
  };

  // Generate pitch deck
  const handleGeneratePitchDeck = async () => {
    if (isGenerating || isChatLoading) return;

    // Validate we have the required data BEFORE setting loading state
    if (!sessionData.challenge) {
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "Please go back and complete the Challenge phase first, as the challenge information is required to generate your pitch deck.",
        timestamp: Date.now(),
      });
      return;
    }

    if (!selectedIdea) {
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "Please select an idea from the Ideation phase first. You need to choose which innovation to create a pitch deck for.",
        timestamp: Date.now(),
      });
      return;
    }

    // Set loading state and proceed
    setIsGenerating(true);
    const baseTime = Date.now();
    const aiMessageId = `ai-${baseTime}`;
    let aiMessageAdded = false;

    // Add user message
    addMessage({
      id: `user-${baseTime}`,
      role: "user",
      content: "Generate pitch deck",
      timestamp: baseTime,
    });

    try {
      const response = await fetch("/api/ai/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: sessionData.challenge,
          marketAnalysis: sessionData.marketAnalysis,
          selectedIdea,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                fullResponse += data.chunk;

                // Filter out JSON code blocks from chat display
                let displayContent = fullResponse;
                const jsonStartIndex = displayContent.indexOf("```json");
                const jsonEndIndex = displayContent.indexOf("\n```", jsonStartIndex + 7);

                if (jsonStartIndex !== -1) {
                  if (jsonEndIndex !== -1) {
                    displayContent = displayContent.substring(0, jsonStartIndex).trim();
                  } else {
                    displayContent = displayContent.substring(0, jsonStartIndex).trim();
                  }
                }

                // Add AI message on first chunk, update on subsequent chunks
                if (!aiMessageAdded) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: aiMessageId,
                      role: "assistant",
                      content: displayContent,
                      timestamp: baseTime,
                    }
                  ]);
                  aiMessageAdded = true;
                } else {
                  // Update existing message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: displayContent }
                        : msg
                    )
                  );
                }
              }

              if (data.done) {
                if (data.type === "pitch_deck" && data.data) {
                  setPitchDeck(data.data);
                  setHasGenerated(true);
                  savePitchDeck(data.data);

                  const confirmationMsg = `I've generated your pitch deck "${data.data.title}" with ${data.data.slides.length} slides. You can navigate through slides on the right, download as PDF, or ask me to help refine specific content.`;

                  // Update existing message or add new one if not yet added
                  if (aiMessageAdded) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, content: confirmationMsg }
                          : msg
                      )
                    );
                  } else {
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: aiMessageId,
                        role: "assistant",
                        content: confirmationMsg,
                        timestamp: baseTime,
                      }
                    ]);
                  }
                } else if (data.type === "error") {
                  const errorMsg = "Sorry, I encountered an error generating the pitch deck. Please try regenerating.";
                  if (aiMessageAdded) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, content: errorMsg }
                          : msg
                      )
                    );
                  } else {
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: aiMessageId,
                        role: "assistant",
                        content: errorMsg,
                        timestamp: baseTime,
                      }
                    ]);
                  }
                } else if (data.type === "text") {
                  // API returned text instead of pitch deck (JSON parsing failed on server)
                  const textMsg = data.data || "I couldn't generate a valid pitch deck. Please try again.";
                  if (aiMessageAdded) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, content: textMsg }
                          : msg
                      )
                    );
                  } else {
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: aiMessageId,
                        role: "assistant",
                        content: textMsg,
                        timestamp: baseTime,
                      }
                    ]);
                  }
                }
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating pitch deck:", error);
      const errorMsg = "Sorry, I encountered an error generating the pitch deck. Please try regenerating.";
      if (aiMessageAdded) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: errorMsg }
              : msg
          )
        );
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            role: "assistant",
            content: errorMsg,
            timestamp: baseTime,
          }
        ]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Send message to assistant
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsChatLoading(true);

    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages([...updatedMessages, aiMsg]);

    try {
      await streamChatResponse(
        "/api/assistant/pitch",
        {
          pitchDeck,
          userInput: inputValue,
          conversationHistory: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          // Pass context from previous phases
          challenge: sessionData.challenge,
          marketAnalysis: sessionData.marketAnalysis,
          selectedIdea,
        },
        {
          onChunk: (chunk, displayContent) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: displayContent } : msg
              )
            );
          },
          onComplete: (data) => {
            if (data.type === "update" && data.data) {
              setPitchDeck(data.data);
              savePitchDeck(data.data);

              const confirmationMsg = `\n\nI've updated your pitch deck "${data.data.title}" with ${data.data.slides.length} slides. The changes are now reflected in the slide view.`;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId
                    ? { ...msg, content: (msg.content || "") + confirmationMsg }
                    : msg
                )
              );
            }
          },
          onError: (errorMessage) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: errorMessage } : msg
              )
            );
          },
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: "Sorry, I couldn't process that question. Please try again." }
            : msg
        )
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  // Slide navigation
  const nextSlide = () => {
    if (pitchDeck && currentSlideIndex < pitchDeck.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // Static suggestion chips (unchanging) with dynamic data
  const suggestionChips = [
    { label: "Generate Pitch Deck", icon: Sparkles, action: handleGeneratePitchDeck, variant: "primary" as const },
    {
      label: "What to expect",
      action: () => {
        if (pitchDeck) {
          setInputValue(`My pitch deck "${pitchDeck.title}" has ${pitchDeck.slides?.length || 0} slides. What should I expect from this structure?`);
        } else {
          setInputValue("What should I expect in my pitch deck?");
        }
      }
    },
    {
      label: "Pitch tips",
      action: () => {
        if (pitchDeck && selectedIdea) {
          setInputValue(`Give me tips for pitching "${selectedIdea.name}" to investors`);
        } else {
          setInputValue("Give me tips for a great pitch");
        }
      }
    },
    {
      label: "Improve titles",
      action: () => {
        if (pitchDeck?.slides) {
          setInputValue(`How can I improve these slide titles: ${pitchDeck.slides.map(s => s.title).join(", ")}?`);
        } else {
          setInputValue("How can I improve my slide titles?");
        }
      }
    },
    {
      label: "Presentation tips",
      action: () => {
        if (selectedIdea) {
          setInputValue(`Give me presentation tips for pitching "${selectedIdea.name}"`);
        } else {
          setInputValue("Give me presentation tips for my pitch");
        }
      }
    },
    {
      label: "Slide talking points",
      action: () => {
        if (pitchDeck?.slides) {
          setInputValue(`What talking points should I include for these slides: ${pitchDeck.slides.slice(0, 3).map(s => s.title).join(", ")}?`);
        } else {
          setInputValue("What should I say in each slide?");
        }
      }
    },
  ];

  // Before pitch deck is generated - show ready state
  if (!hasGenerated && !pitchDeck) {
    return (
      <PhaseLayout
        currentStep="pitch"
        showRightPanel={true}
        headerProps={{ showRestart: true }}
        leftPanel={
          <PhaseChat
            title="Pitch Consultant"
            subtitle={isGenerating ? "Generating..." : "Ready to help"}
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading || isGenerating}
            suggestionChips={suggestionChips}
            placeholder="Ask me anything about generating your pitch deck..."
          />
        }
        rightPanel={
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
              <div className="flex items-center gap-2">
                <Presentation className="h-4 w-4 text-slate-600" />
                <h1 className="text-sm font-semibold">{isGenerating ? "Generating" : "Ready to Generate"}</h1>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
              <div className="container mx-auto px-6 py-6 max-w-5xl">
                {selectedIdea && (
                  <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    <CollapsibleReviewSummary
                      challenge={sessionData.challenge}
                      marketAnalysis={sessionData.marketAnalysis}
                      selectedIdea={selectedIdea}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        navProps={{
          onPrevious: handleBack,
          showRestart: true,
        }}
      />
    );
  }

  // After pitch deck is generated - show slide viewer
  return (
    <PhaseLayout
      currentStep="pitch"
      showRightPanel={true}
      headerProps={{ showRestart: true }}
      leftPanel={
        <PhaseChat
          title="Pitch Consultant"
          subtitle="Refine slides"
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
          isLoading={isChatLoading || isGenerating}
          suggestionChips={suggestionChips}
          placeholder="Ask to refine slides, improve content, or get presentation tips..."
        />
      }
      rightPanel={
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-background to-muted/20">
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
            <div className="flex items-center gap-2">
              <Presentation className="h-4 w-4 text-slate-600" />
              <h1 className="text-sm font-semibold">Pitch Deck</h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">
            {/* Innovation Plan Summary Card */}
            {selectedIdea && (
              <Card className="mx-6 mt-6 border-2">
                <div
                  className="px-5 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsReviewSummaryExpanded(!isReviewSummaryExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Target className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-semibold">Innovation Plan Summary</span>
                      <Badge variant="outline" className="text-xs">{selectedIdea.metrics?.roi?.toUpperCase() || "N/A"} ROI</Badge>
                    </div>
                    {isReviewSummaryExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isReviewSummaryExpanded && (
                  <CardContent className="pt-4">
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      {(selectedIdea.metrics ? [
                        { label: "Market Fit", value: (selectedIdea.metrics as any).marketFit || (selectedIdea.metrics as any).marketFit?.score },
                        { label: "Feasibility", value: (selectedIdea.metrics as any).feasibility || (selectedIdea.metrics as any).financialViability?.score },
                        { label: "Innovation", value: (selectedIdea.metrics as any).innovation || (selectedIdea.metrics as any).innovation?.score },
                      ] : []).map((metric) => {
                        const numericValue = typeof metric.value === 'number' ? metric.value : (metric.value?.score ?? 0);
                        return (
                          <div key={metric.label} className="text-center p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                            <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase">{metric.label}</p>
                            <p className={`text-xl font-bold ${numericValue >= 70 ? "text-green-600 dark:text-green-400" : numericValue >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                              {numericValue}%
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm font-serif">
                      <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-1.5 mb-1"><Target className="h-3.5 w-3.5 text-purple-600" /><span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Problem</span></div>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300">{selectedIdea.problemSolved}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-1.5 mb-1"><DollarSign className="h-3.5 w-3.5 text-green-600" /><span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Business Model</span></div>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300">{selectedIdea.businessModel}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {pitchDeck && (
              <SlideViewer
                pitchDeck={pitchDeck}
                currentSlideIndex={currentSlideIndex}
                onPreviousSlide={previousSlide}
                onNextSlide={nextSlide}
                onSelectSlide={setCurrentSlideIndex}
              />
            )}
          </div>
        </div>
      }
      navProps={{
        onPrevious: handleBack,
        showRestart: true,
      }}
    />
  );
}
