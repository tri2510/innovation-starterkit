/**
 * Interactive Appraisal Component
 * Handles chat-based appraisal consultation with appraisal-specific UI
 * Like ideate-interactive.tsx pattern
 */

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, BarChart3, Target, ChevronDown, ChevronUp } from "lucide-react";
import { streamChatResponse } from "@/hooks/use-chat-streaming";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatMessageWithRetry } from "@/components/chat/chat-message";
import { Badge } from "@/components/ui/badge";
import { WizardNav } from "@/components/wizard/wizard-nav";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/innovation";
import type { BusinessIdea } from "@/types/innovation";
import {
  defaultAppraisalProgress,
  calculateAppraisalProgress,
  getAppraisalProgressTip,
  type AppraisalProgressItem,
  type ProgressTip,
} from "@/lib/appraisal-utils";
import { AppraisalSectionCards } from "./appraisal-section-cards";
import { AppraisalDetailView } from "./appraisal-detail-view";
import { extractMarketValue } from "@/lib/market-utils";

interface InteractiveAppraisalProps {
  challenge: { problem: string; targetAudience: string; currentSolutions: string };
  marketAnalysis: any;
  selectedIdea: BusinessIdea | null;
  appraisalData: any;
  setAppraisalData: (data: any) => void;
  onSaveAppraisal: (data: any) => void;
  onBack?: () => void;
  onContinue?: () => void;
  isContinueDisabled?: boolean;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export function InteractiveAppraisal({
  challenge,
  marketAnalysis,
  selectedIdea,
  appraisalData,
  setAppraisalData,
  onSaveAppraisal,
  onBack,
  onContinue,
  isContinueDisabled = false,
  initialMessages,
  onMessagesChange,
}: InteractiveAppraisalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [appraisalProgress, setAppraisalProgress] = useState<AppraisalProgressItem[]>(defaultAppraisalProgress);
  const [overallProgress, setOverallProgress] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(undefined);
  const [isMarketExpanded, setIsMarketExpanded] = useState(false);
  const [isIdeaExpanded, setIsIdeaExpanded] = useState(true); // Default expanded for reference

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Initialize appraisal progress from existing data
  useEffect(() => {
    if (appraisalData) {
      const updatedProgress: AppraisalProgressItem[] = [
        { ...defaultAppraisalProgress[0], status: appraisalData.targetMarket ? "complete" : "waiting", excerpt: appraisalData.targetMarket?.substring(0, 50) + "..." },
        { ...defaultAppraisalProgress[1], status: appraisalData.businessModel ? "complete" : "waiting", excerpt: appraisalData.businessModel?.substring(0, 50) + "..." },
        { ...defaultAppraisalProgress[2], status: appraisalData.competitiveAdvantage ? "complete" : "waiting", excerpt: appraisalData.competitiveAdvantage?.substring(0, 50) + "..." },
        { ...defaultAppraisalProgress[3], status: appraisalData.personnelCosts || appraisalData.estimatedInvestment ? "complete" : "waiting", excerpt: appraisalData.estimatedInvestment || appraisalData.personnelCosts?.totalAnnual },
        { ...defaultAppraisalProgress[4], status: appraisalData.revenueForecasts ? "complete" : "waiting", excerpt: appraisalData.financialAnalysis?.fiveYearRevenue },
        { ...defaultAppraisalProgress[5], status: appraisalData.financialAnalysis || selectedIdea?.metrics ? "complete" : "waiting", excerpt: appraisalData.financialAnalysis?.roi },
        { ...defaultAppraisalProgress[6], status: appraisalData.riskAssessment || selectedIdea?.timeframe ? "complete" : "waiting", excerpt: appraisalData.riskAssessment?.riskLevel || selectedIdea?.timeframe },
      ];
      setAppraisalProgress(updatedProgress);
      setOverallProgress(calculateAppraisalProgress(updatedProgress));
    }
  }, [appraisalData, selectedIdea]);

  useEffect(() => {
    if (messages.length === 0) {
      let greetingMessage: ChatMessage;

      if (appraisalData) {
        greetingMessage = {
          id: "greeting",
          role: "assistant",
          content: `Great! I've completed your investment appraisal for "${selectedIdea?.name || "the selected idea"}".

You can review the detailed analysis on the right, click on any section to expand it, or ask me to refine specific aspects.`,
          timestamp: Date.now(),
        };
      } else {
        greetingMessage = {
          id: "greeting",
          role: "assistant",
          content: `I'm your investment analyst. I'll help you build a comprehensive appraisal for "${selectedIdea?.name || "the selected idea"}".

This will include:
- **Target Market Analysis**
- **Business Model & Revenue Streams**
- **Competitive Advantage**
- **Investment & Cost Structure**
- **Revenue Forecasts**
- **Financial Metrics & Scoring**
- **Risk Assessment & Timeline**

Click "Generate Appraisal" to start the analysis.`,
          timestamp: Date.now(),
        };
      }
      setMessages([greetingMessage]);
    }
  }, [selectedIdea?.name, messages.length, appraisalData]);

  const visibleMessages = useMemo(() => {
    return messages.filter((m) => {
      if (m.role === "user") return true;
      return m.content && m.content.trim().length > 0;
    });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    if (lastUserMessage.trim() && !isLoading) {
      handleSendMessage(lastUserMessage);
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    const contentToSend = messageContent || inputValue;
    if (!contentToSend.trim() || isLoading) return;

    setLastUserMessage(contentToSend);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: contentToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (!messageContent) {
      setInputValue("");
    }

    setIsLoading(true);

    const aiMessageId = "ai-" + Date.now();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      await streamChatResponse(
        "/api/assistant/investment-appraisal",
        {
          userInput: contentToSend,
          conversationHistory: messages.map(({ id, ...rest }) => rest),
          challenge,
          marketAnalysis,
          selectedIdea,
          currentAppraisal: appraisalData,
        },
        {
          filterDisplayContent: (content) => {
            const hasAppraisalUpdate = content.includes("APPRAISAL_UPDATE");
            if (hasAppraisalUpdate) {
              let filtered = content;
              filtered = filtered.replace(/[\s\S]*?```json\s*[\s\S]*?APPRAISAL_UPDATE[\s\S]*?\n```/g, "");
              filtered = filtered.replace(/[\s\S]*?Here['']?s? the updated appraisal[\s\S]*?APPRAISAL/g, "");
              filtered = filtered.replace(/Here['']?s? the updated appraisal[\s\S]*?```/gi, "");
              filtered = filtered.replace(/[\s\S]*?Here's the updated data[\s\S]*?APPRAISAL/g, "");
              filtered = filtered.replace(/Here is the updated data[\s\S]*?APPRAISAL/g, "");
              return filtered.trim();
            }
            return content;
          },

          onChunk: (chunk, displayContent, fullResponse, data) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId ? { ...m, content: displayContent } : m
              )
            );
          },

          onComplete: (data, finalContent) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId ? { ...m, content: finalContent || "" } : m
              )
            );

            // Handle appraisal_update from API
            if (data.type === "appraisal_update" && data.data) {
              const updatedAppraisal = data.data;
              setAppraisalData(updatedAppraisal);
              onSaveAppraisal(updatedAppraisal);

              // Update progress to complete
              const updatedProgress: AppraisalProgressItem[] = [
                { ...defaultAppraisalProgress[0], status: "complete", excerpt: updatedAppraisal.targetMarket?.substring(0, 50) + "..." },
                { ...defaultAppraisalProgress[1], status: "complete", excerpt: updatedAppraisal.businessModel?.substring(0, 50) + "..." },
                { ...defaultAppraisalProgress[2], status: "complete", excerpt: updatedAppraisal.competitiveAdvantage?.substring(0, 50) + "..." },
                { ...defaultAppraisalProgress[3], status: "complete", excerpt: updatedAppraisal.estimatedInvestment },
                { ...defaultAppraisalProgress[4], status: "complete", excerpt: updatedAppraisal.financialAnalysis?.fiveYearRevenue },
                { ...defaultAppraisalProgress[5], status: "complete", excerpt: updatedAppraisal.financialAnalysis?.roi },
                { ...defaultAppraisalProgress[6], status: "complete", excerpt: updatedAppraisal.riskAssessment?.riskLevel },
              ];
              setAppraisalProgress(updatedProgress);
              setOverallProgress(100);
              setCelebrationMessage("Appraisal complete! Review the detailed analysis on the right.");
              setTimeout(() => setCelebrationMessage(null), 3000);
            }
          },

          onError: (errorMessage) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, content: errorMessage } : msg
              )
            );
          },
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: "Sorry, I encountered an error. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateAppraisal = async () => {
    // Use the chat function instead of a separate endpoint
    await handleSendMessage("Generate comprehensive investment appraisal with all sections");
  };

  const progressTip: ProgressTip | null = getAppraisalProgressTip(overallProgress, !!appraisalData, celebrationMessage);

  return (
    <div className="flex gap-4 h-full">
      {/* Chat Panel */}
      <div className="w-[420px] flex-shrink-0 border-r bg-muted/10 flex flex-col">
        {/* Chat Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
          <h2 className="text-sm font-medium">Investment Analyst</h2>
          <span className="text-xs text-muted-foreground">Financial expert</span>
        </div>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {visibleMessages.map((message) => (
              <ChatMessageWithRetry
                key={message.id}
                message={message}
                isLoading={isLoading}
                onRetry={handleRetry}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-4 py-3 border-t bg-background/95">
          {/* Quick action chips - static */}
          {!isLoading && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Button
                onClick={generateAppraisal}
                size="sm"
                variant="outline"
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 hover:border-purple-300 h-auto"
              >
                <Sparkles className="h-3 w-3" />
                Generate Appraisal
              </Button>
              <Button
                onClick={() => setInputValue("Refine the business model")}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Refine business model
              </Button>
              <Button
                onClick={() => setInputValue("Update revenue projections")}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Update projections
              </Button>
              <Button
                onClick={() => setInputValue("Explain the risk assessment")}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Explain the risks
              </Button>
              <Button
                onClick={() => setInputValue("What's the timeline to profitability?")}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Timeline
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={appraisalData ? "Ask to refine specific sections..." : "Ask about the appraisal..."}
              className="min-h-[48px] max-h-[100px] resize-y text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Appraisal Display Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <h1 className="text-sm font-semibold">
              {appraisalData ? "Investment Appraisal" : "Generate Appraisal"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {appraisalData ? "Complete" : "Waiting"}
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round(overallProgress)}%
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="px-6 py-6 space-y-6">
            {/* Progress Tip */}
            {progressTip && (
              <div className={cn(
                "flex items-center gap-2 text-sm px-4 py-3 rounded-lg",
                progressTip.type === "success" || progressTip.type === "celebration"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              )}>
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{progressTip.text}</span>
              </div>
            )}

            {/* Selected Idea Summary - Collapsible for reference */}
            {selectedIdea && (
              <Card className="border-2">
                <div
                  className="px-5 py-3 border-b bg-purple-50 dark:bg-purple-950/30 cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/50 transition-colors"
                  onClick={() => setIsIdeaExpanded(!isIdeaExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <Target className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-semibold">Selected Idea (Reference)</span>
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">From ideation phase</span>
                    </div>
                    {isIdeaExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {isIdeaExpanded && (
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{selectedIdea.name}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 italic mt-1">"{selectedIdea.tagline}"</p>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{selectedIdea.description}</p>
                    {selectedIdea.problemSolved && (
                      <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">Problem Solved</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedIdea.problemSolved}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Market Context Card */}
            {marketAnalysis && (
              <Card className="border-2">
                <div
                  className="px-5 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsMarketExpanded(!isMarketExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <BarChart3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-semibold">Market Context</span>
                      <Badge variant="outline" className="text-xs">
                        TAM: {extractMarketValue(marketAnalysis?.tam || "N/A").value}
                      </Badge>
                    </div>
                    {isMarketExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {isMarketExpanded && (
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {["TAM", "SAM", "SOM"].map((size) => {
                        const value = size === "TAM" ? marketAnalysis?.tam : size === "SAM" ? marketAnalysis?.sam : marketAnalysis?.som;
                        const { value: displayValue, description } = extractMarketValue(value || "N/A");
                        return (
                          <div key={size} className="text-center p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                            <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1">{size}</p>
                            <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">{displayValue}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Section Cards or Detail View */}
            {selectedSectionId ? (
              <AppraisalDetailView
                section={appraisalProgress.find(s => s.id === selectedSectionId)!}
                appraisalData={appraisalData}
                selectedIdea={selectedIdea}
                onBack={() => setSelectedSectionId(undefined)}
              />
            ) : (
              <>
                {/* Always show section cards as placeholders */}
                <AppraisalSectionCards
                  sections={appraisalProgress}
                  selectedSectionId={selectedSectionId}
                  onSelectSection={setSelectedSectionId}
                  isLoading={isLoading}
                />

                {/* Show empty state message below cards if no appraisal data */}
                {!appraisalData && (
                  <Card className="border-dashed mt-4">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Sparkles className="h-8 w-8 text-purple-400 mb-2" />
                      <p className="text-sm text-muted-foreground text-center px-8">
                        Click "Generate Appraisal" to fill all sections
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        {(onBack || onContinue) && (
          <div className="flex-shrink-0 border-t bg-background/95 px-4 py-3">
            <WizardNav
              currentStep="investment-appraisal"
              onPrevious={onBack}
              onNext={onContinue}
              nextLabel="Generate Pitch"
              isNextDisabled={isContinueDisabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
