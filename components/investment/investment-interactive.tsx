"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, Lightbulb, TrendingUp, DollarSign, AlertTriangle, BarChart3 } from "lucide-react";
import type { Challenge, MarketAnalysis, BusinessIdea, ChatMessage } from "@/types/innovation";
import { streamChatResponse } from "@/hooks/use-chat-streaming";
import { InvestmentProgressCard } from "./investment-progress-cards";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatMessageWithRetry } from "@/components/chat/chat-message";
import {
  defaultInvestmentProgress,
  calculateInvestmentProgress,
  getInvestmentProgressTip,
  celebrationMessages,
  getSectionStartMessage,
} from "@/lib/investment-utils";
import { cn } from "@/lib/utils";

interface InteractiveInvestmentAppraisalProps {
  challenge: Challenge;
  marketAnalysis?: MarketAnalysis;
  selectedIdea?: BusinessIdea;
  appraisalData: any;
  setAppraisalData: (data: any) => void;
  onSaveAppraisal: (data: any) => void;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onContinue?: () => void;
  isContinueDisabled?: boolean;
  investmentProgress?: any;
  setInvestmentProgress?: (progress: any) => void;
}

export function InteractiveInvestmentAppraisal({
  challenge,
  marketAnalysis,
  selectedIdea,
  appraisalData,
  setAppraisalData,
  onSaveAppraisal,
  initialMessages,
  onMessagesChange,
  onContinue,
  isContinueDisabled,
  investmentProgress: externalInvestmentProgress,
  setInvestmentProgress: externalSetInvestmentProgress,
}: InteractiveInvestmentAppraisalProps) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");

  // Progress tracking state - use external if provided, otherwise internal
  const [internalInvestmentProgress, setInternalInvestmentProgress] = useState(defaultInvestmentProgress);
  const investmentProgress = externalInvestmentProgress ?? internalInvestmentProgress;
  const setInvestmentProgress = externalSetInvestmentProgress ?? setInternalInvestmentProgress;
  const [overallProgress, setOverallProgress] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(undefined);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync messages with parent
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Calculate overall progress when progress items change
  useEffect(() => {
    setOverallProgress(calculateInvestmentProgress(investmentProgress));
  }, [investmentProgress]);

  // Handle retry for failed messages
  const handleRetry = useCallback(() => {
    if (lastUserMessage.trim() && !isLoading) {
      setInputValue(lastUserMessage);
    }
  }, [lastUserMessage, isLoading]);

  // Generate initial appraisal
  const generateInitialAppraisal = useCallback(async () => {
    setInputValue("");
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: "Generate comprehensive investment appraisal",
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    const aiMsgId = "ai-" + Date.now();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages([...updatedMessages, aiMsg]);

    try {
      setIsLoading(true);
      await streamChatResponse(
        "/api/assistant/investment-appraisal",
        {
          userInput: "Generate comprehensive investment appraisal",
          conversationHistory: updatedMessages.map(({ role, content }) => ({ role, content })),
          challenge,
          marketAnalysis,
          selectedIdea,
        },
        {
          timeout: 180000, // 3 minutes - investment appraisal takes longer
          filterDisplayContent: (content) => {
            // Hide JSON code blocks from chat display
            let filtered = content.replace(/```json\s*[\s\S]*?```/g, '');
            // Also handle incomplete/unclosed code blocks that might have ```
            filtered = filtered.replace(/```\w*\s*$/g, '');
            filtered = filtered.replace(/```\w*\s*[\s\S]*?$/g, '');
            filtered = filtered.replace(/\{[\s\S]*?"APPRAISAL_UPDATE"[\s\S]*?\}/g, '');
            // Clean up any trailing ``` markers
            filtered = filtered.replace(/```\s*$/gm, '');
            // Clean up any orphaned ``` markers
            filtered = filtered.replace(/```\s*/g, '');
            return filtered.trim();
          },

          onChunk: (chunk, displayContent) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: displayContent } : msg
              )
            );
          },

          onProgressUpdate: (update) => {
            // Handle progress updates from streaming
            if (update.type === 'progress_update') {
              const { section, status, excerpt } = update.data as { section: string; status: string; excerpt: string };

              if (status === "gathering") {
                setActiveSectionId(section);
              }

              setInvestmentProgress((prev) => {
                const updated = prev.map((item) => {
                  if (item.id === section) {
                    const wasGathering = item.status === "gathering";

                    if (wasGathering && status === "complete") {
                      const message = celebrationMessages[section as keyof typeof celebrationMessages];
                      if (message) {
                        setCelebrationMessage(message);
                        setTimeout(() => setCelebrationMessage(null), 4000);
                      }
                    }

                    return {
                      ...item,
                      status: status as "gathering" | "awaiting_confirmation" | "complete",
                      excerpt: (excerpt || item.excerpt) || "",
                    };
                  }
                  return item;
                });

                return updated;
              });
            }
          },

          onComplete: (data) => {
            if (data.type === "appraisal_update" && data.data) {
              setAppraisalData(data.data);
              onSaveAppraisal(data.data);

              // Update progress items with excerpts from appraisal data
              setInvestmentProgress((prev) =>
                prev.map((item) => {
                  const excerptMap: Record<string, string> = {
                    personnel_costs: data.data.personnelCosts?.totalAnnual || "",
                    operating_expenses: data.data.operatingExpenses?.totalMonthly || "",
                    capital_investments: data.data.capitalInvestments?.totalInitial || "",
                    revenue_forecasts: data.data.financialAnalysis?.fiveYearRevenue || "",
                    financial_analysis: `${data.data.financialAnalysis?.roi || ''} ROI` || "",
                    risk_assessment: data.data.riskAssessment?.riskLevel || "",
                  };

                  return {
                    ...item,
                    status: "complete" as const,
                    excerpt: excerptMap[item.id] || "",
                  };
                })
              );
              setActiveSectionId(undefined);
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
      console.error("Failed to generate appraisal:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, content: "Sorry, I encountered an error generating the appraisal. Please try again." } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, challenge, marketAnalysis, selectedIdea, setAppraisalData, onSaveAppraisal, setInvestmentProgress]);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    setLastUserMessage(inputValue);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    const aiMsgId = "ai-" + Date.now();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages([...updatedMessages, aiMsg]);

    try {
      await streamChatResponse(
        "/api/assistant/investment-appraisal",
        {
          userInput: inputValue,
          conversationHistory: updatedMessages.map(({ role, content }) => ({ role, content })),
          challenge,
          marketAnalysis,
          selectedIdea,
          appraisalData,
        },
        {
          timeout: 180000, // 3 minutes - investment appraisal takes longer
          filterDisplayContent: (content) => {
            // Hide JSON code blocks from chat display
            let filtered = content.replace(/```json\s*[\s\S]*?```/g, '');
            // Also handle incomplete/unclosed code blocks that might have ```
            filtered = filtered.replace(/```\w*\s*$/g, '');
            filtered = filtered.replace(/```\w*\s*[\s\S]*?$/g, '');
            filtered = filtered.replace(/\{[\s\S]*?"APPRAISAL_UPDATE"[\s\S]*?\}/g, '');
            // Clean up any trailing ``` markers
            filtered = filtered.replace(/```\s*$/gm, '');
            // Clean up any orphaned ``` markers
            filtered = filtered.replace(/```\s*/g, '');
            return filtered.trim();
          },

          onChunk: (chunk, displayContent) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: displayContent } : msg
              )
            );
          },

          onProgressUpdate: (update) => {
            if (update.type === 'progress_update') {
              const { section, status, excerpt } = update.data as { section: string; status: string; excerpt: string };

              if (status === "gathering") {
                setActiveSectionId(section);
              }

              setInvestmentProgress((prev) => {
                const updated = prev.map((item) => {
                  if (item.id === section) {
                    const wasGathering = item.status === "gathering";

                    if (wasGathering && status === "complete") {
                      const message = celebrationMessages[section as keyof typeof celebrationMessages];
                      if (message) {
                        setCelebrationMessage(message);
                        setTimeout(() => setCelebrationMessage(null), 4000);
                      }
                    }

                    return {
                      ...item,
                      status: status as "gathering" | "awaiting_confirmation" | "complete",
                      excerpt: (excerpt || item.excerpt) || "",
                    };
                  }
                  return item;
                });

                return updated;
              });
            }
          },

          onComplete: (data) => {
            if (data.type === "appraisal_update" && data.data) {
              setAppraisalData(data.data);
              onSaveAppraisal(data.data);

              // Update progress items with excerpts from appraisal data
              setInvestmentProgress((prev) =>
                prev.map((item) => {
                  const excerptMap: Record<string, string> = {
                    personnel_costs: data.data.personnelCosts?.totalAnnual || "",
                    operating_expenses: data.data.operatingExpenses?.totalMonthly || "",
                    capital_investments: data.data.capitalInvestments?.totalInitial || "",
                    revenue_forecasts: data.data.financialAnalysis?.fiveYearRevenue || "",
                    financial_analysis: `${data.data.financialAnalysis?.roi || ''} ROI` || "",
                    risk_assessment: data.data.riskAssessment?.riskLevel || "",
                  };

                  return {
                    ...item,
                    status: "complete" as const,
                    excerpt: excerptMap[item.id] || item.excerpt || "",
                  };
                })
              );
              setActiveSectionId(undefined);
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
      console.error("Failed to send message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, content: "Sorry, I encountered an error. Please try again." } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, inputValue, isLoading, challenge, marketAnalysis, selectedIdea, appraisalData, setAppraisalData, onSaveAppraisal, setInvestmentProgress]);

  // Static suggestion chips (unchanging) with dynamic data
  const suggestionChips = [
    {
      label: "Generate Appraisal",
      action: generateInitialAppraisal,
      disabled: isLoading,
      variant: "primary" as const,
    },
    {
      label: "Financial highlights",
      action: () => {
        if (appraisalData?.financialAnalysis) {
          setInputValue(`Current financial highlights: ROI ${appraisalData.financialAnalysis.roi}, Payback ${appraisalData.financialAnalysis.paybackPeriod}, NPV ${appraisalData.financialAnalysis.npv}`);
        } else {
          setInputValue("What are the key financial highlights and ROI?");
        }
      },
      disabled: isLoading,
    },
    {
      label: "Risk analysis",
      action: () => {
        if (appraisalData?.riskAssessment) {
          setInputValue(`Current risk level: ${appraisalData.riskAssessment.riskLevel}, Viability: ${appraisalData.riskAssessment.viabilityScore}`);
        } else {
          setInputValue("What's the risk assessment and viability score?");
        }
      },
      disabled: isLoading,
    },
    {
      label: "Revenue projections",
      action: () => {
        if (appraisalData?.revenueForecasts) {
          setInputValue(`Revenue projections: Year 1 ${appraisalData.revenueForecasts.year1?.projected}, Year 2 ${appraisalData.revenueForecasts.year2?.projected}, Year 3 ${appraisalData.revenueForecasts.year3?.projected}`);
        } else {
          setInputValue("Break down the 5-year revenue projections");
        }
      },
      disabled: isLoading,
    },
    {
      label: "Team & costs",
      action: () => {
        if (appraisalData?.personnelCosts) {
          setInputValue(`Current team: ${appraisalData.personnelCosts.team?.map((t: any) => t.role).join(", ")}, Total annual: ${appraisalData.personnelCosts.totalAnnual}`);
        } else {
          setInputValue("Explain the team structure and personnel costs");
        }
      },
      disabled: isLoading,
    },
  ];

  // Progress tip
  const progressTip = getInvestmentProgressTip(overallProgress, !!appraisalData, celebrationMessage, activeSectionId);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-background/95">
        <h2 className="text-sm font-medium">Investment Analyst</h2>
        <p className="text-xs text-muted-foreground">
          {appraisalData ? "Financial analysis complete" : `Building financial model for "${selectedIdea?.name}"`}
        </p>
      </div>

      {/* Scrollable Chat Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="space-y-4">
          {messages.map((message) => (
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

      {/* Progress Banner */}
      {progressTip && (
        <div className={cn(
          "flex-shrink-0 px-4 py-2 border-b",
          progressTip.type === "celebration" && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
          progressTip.type === "success" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
          progressTip.type === "progress" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
        )}>
          <div className="flex items-center gap-2">
            <progressTip.icon className={cn(
              "h-4 w-4",
              progressTip.type === "celebration" && "text-green-600 dark:text-green-400",
              progressTip.type === "success" && "text-blue-600 dark:text-blue-400",
              progressTip.type === "progress" && "text-blue-600 dark:text-blue-400"
            )} />
            <span className="text-xs font-medium">{progressTip.text}</span>
          </div>
        </div>
      )}

      {/* Suggestion Chips */}
      <div className="flex-shrink-0 px-4 pb-3">
        {appraisalData && (
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Explore:</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {suggestionChips.map((chip, index) => (
            <button
              key={index}
              onClick={chip.action}
              disabled={chip.disabled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                chip.variant === "primary"
                  ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              {chip.variant === "primary" && <Sparkles className="h-3.5 w-3.5" />}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-background/95">
        <div className="flex items-end gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading && inputValue.trim()) {
                  handleSendMessage();
                }
              }
            }}
            placeholder={appraisalData ? "Ask about the financial model, risks, projections..." : "Describe your team, costs, revenue projections..."}
            className="min-h-[48px] max-h-[100px] resize-y text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
