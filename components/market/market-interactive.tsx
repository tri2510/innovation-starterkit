/**
 * Interactive Market Analysis Component
 * Handles the chat-based market analysis consultation with market-specific UI
 */

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, BarChart3, Target, TrendingUp, Users, Zap, AlertTriangle, Check, X, Info } from "lucide-react";
import { streamChatResponse, MarketProgressUpdateChunk } from "@/hooks/use-chat-streaming";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatMessageWithRetry } from "@/components/chat/chat-message";
import { Badge } from "@/components/ui/badge";
import { WizardNav } from "@/components/wizard/wizard-nav";
import type { ChatMessage } from "@/types/innovation";
import {
  defaultMarketProgress,
  calculateMarketProgress,
  getMarketProgressTip,
  extractMarketValue,
  type MarketProgressItem
} from "@/lib/market-utils";

interface InteractiveMarketAnalysisProps {
  challenge: { problem: string; targetAudience: string; currentSolutions: string; industry?: string; context?: string };
  marketAnalysis: any;
  setMarketAnalysis: (analysis: any) => void;
  onSaveMarketAnalysis: (analysis: any) => void;
  onBack?: () => void;
  onContinue?: () => void;
  isContinueDisabled?: boolean;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export function InteractiveMarketAnalysis({
  challenge,
  marketAnalysis,
  setMarketAnalysis,
  onSaveMarketAnalysis,
  onBack,
  onContinue,
  isContinueDisabled = false,
  initialMessages,
  onMessagesChange
}: InteractiveMarketAnalysisProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [marketProgress, setMarketProgress] = useState<MarketProgressItem[]>(defaultMarketProgress);
  const [overallProgress, setOverallProgress] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync messages with parent component
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Hot key to clear all phase content for testing (Ctrl+Shift+X)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'X') {
        event.preventDefault();
        // Clear all phase content
        setMessages([]);
        setMarketProgress(defaultMarketProgress);
        setOverallProgress(0);
        setMarketAnalysis(null);
        setInputValue("");
        // Reinitialize greeting
        const greetingMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: `Hi! I'm your market analyst. I'll help you analyze the market for "${challenge.problem}" targeting ${challenge.targetAudience}.

Let's start with your market size. Do you know the Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM)?`,
          timestamp: Date.now()
        };
        setMessages([greetingMessage]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [challenge]);

  // Initialize market progress from existing market analysis
  useEffect(() => {
    if (marketAnalysis) {
      console.log('Updating market progress from analysis:', marketAnalysis);

      // Only mark sections as complete if they have actual data
      const hasMarketSize = !!(marketAnalysis.tam || marketAnalysis.sam || marketAnalysis.som);
      const hasTrends = marketAnalysis.trends && marketAnalysis.trends.length > 0;
      const hasCompetitors = marketAnalysis.competitors && marketAnalysis.competitors.length > 0;
      const hasOpportunities = marketAnalysis.opportunities && marketAnalysis.opportunities.length > 0;
      const hasChallenges = marketAnalysis.challenges && marketAnalysis.challenges.length > 0;

      const updatedProgress: MarketProgressItem[] = [
        { ...defaultMarketProgress[0], status: hasMarketSize ? "complete" : "gathering", excerpt: marketAnalysis.tam || "" },
        { ...defaultMarketProgress[1], status: hasTrends ? "complete" : "gathering", excerpt: `${marketAnalysis.trends?.length || 0} trends: ${marketAnalysis.trends?.[0]?.name || ''}` },
        { ...defaultMarketProgress[2], status: hasCompetitors ? "complete" : "gathering", excerpt: `${marketAnalysis.competitors?.length || 0} competitors: ${marketAnalysis.competitors?.[0]?.name || ''}` },
        { ...defaultMarketProgress[3], status: hasOpportunities ? "complete" : "gathering", excerpt: `${marketAnalysis.opportunities?.length || 0} opportunities: ${marketAnalysis.opportunities?.[0] || ''}` },
        { ...defaultMarketProgress[4], status: hasChallenges ? "complete" : "waiting", excerpt: marketAnalysis.challenges?.length ? `${marketAnalysis.challenges.length} challenges: ${marketAnalysis.challenges?.[0] || ''}` : "" },
      ];

      setMarketProgress(updatedProgress);
      setOverallProgress(calculateMarketProgress(updatedProgress));
      console.log('Progress updated:', updatedProgress);
    }
  }, [marketAnalysis?.tam]); // Use specific field to force updates

  useEffect(() => {
    if (messages.length === 0) {
      let greetingMessage: ChatMessage;

      if (marketAnalysis) {
        greetingMessage = {
          id: "greeting",
          role: "assistant",
          content: `Great! I've completed your comprehensive market analysis. You can review the detailed findings on the right, or continue the consultation if you'd like to refine any aspects.`,
          timestamp: Date.now(),
        };
      } else {
        greetingMessage = {
          id: "greeting",
          role: "assistant",
          content: `I'm your market analyst consultant. Let's build a comprehensive market analysis for your challenge about "${challenge.problem.substring(0, 50)}...".

Let's start with your **market size**. What's your estimated Total Addressable Market (TAM)? Think about the total global or national market for your solution.`,
          timestamp: Date.now(),
        };
      }
      setMessages([greetingMessage]);
    }
  }, [challenge.problem, messages.length, marketAnalysis]);

  const visibleMessages = useMemo(() => {
    return messages.filter((m) => {
      if (m.role === "user") return true;
      return m.content && m.content.trim().length > 0;
    });
  }, [messages]);

  /**
   * Detect edit intent from user message
   * Returns the section ID to edit, or null if no edit intent
   */
  const detectEditIntent = (userMessage: string): string | null => {
    const lowerMessage = userMessage.toLowerCase();

    // Define edit intent patterns
    const editPatterns = {
      market_size: [
        /change?\s*(the\s+)?market\s*size/i,
        /update?\s*(the\s+)?market\s*size/i,
        /modify?\s*(the\s+)?market\s*size/i,
        /change?\s*(the\s+)?(tam|sam|som)/i,
        /update?\s*(the\s+)?(tam|sam|som)/i,
        /new\s*(market\s*size|tam|sam|som)/i,
        /different?\s*(market\s*size|tam|sam|som)/i,
        /revise?\s*(market\s*size|tam|sam|som)/i,
      ],
      trends: [
        /change?\s*(the\s+)?trends/i,
        /update?\s*(the\s+)?trends/i,
        /modify?\s*(the\s+)?trends/i,
        /new\s+trends/i,
        /different?\s+trends/i,
        /add\s+trends/i,
      ],
      competitors: [
        /change?\s*(the\s+)?competitors/i,
        /update?\s*(the\s+)?competitors/i,
        /modify?\s*(the\s+)?competitors/i,
        /change?\s*(the\s+)?competition/i,
        /update?\s*(the\s+)?competition/i,
        /new\s+competitors/i,
        /add\s+competitors/i,
      ],
      opportunities: [
        /change?\s*(the\s+)?opportunities/i,
        /update?\s*(the\s+)?opportunities/i,
        /modify?\s*(the\s+)?opportunities/i,
        /new\s+opportunities/i,
        /add\s+opportunities/i,
      ],
      challenges: [
        /change?\s*(the\s+)?challenges/i,
        /update?\s*(the\s+)?challenges/i,
        /modify?\s*(the\s+)?challenges/i,
        /new\s+challenges/i,
        /add\s+challenges/i,
      ],
    };

    // Check each pattern
    for (const [section, patterns] of Object.entries(editPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerMessage)) {
          return section;
        }
      }
    }

    return null;
  };

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

    // Detect edit intent before processing
    const editSection = detectEditIntent(contentToSend);

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

    // If edit intent detected, put that section back into gathering mode
    if (editSection && marketAnalysis) {
      setMarketProgress((prev) => {
        const updated = prev.map((item) => {
          if (item.id === editSection) {
            return { ...item, status: "gathering" as const };
          }
          return item;
        });
        setOverallProgress(calculateMarketProgress(updated));
        setActiveSectionId(editSection);
        return updated;
      });
    }

    const aiMessageId = "ai-" + Date.now();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      await streamChatResponse("/api/ai/market",
        {
          userInput: contentToSend,
          conversationHistory: messages.map(({ id, ...rest }) => rest),
          // Pass challenge context from previous phase
          challenge,
          // Pass edit context if detected
          ...(editSection && {
            editSection,
            currentMarketAnalysis: marketAnalysis,
          }),
        },
        {
          filterDisplayContent: (content) => {
            let filtered = content;

            // Remove FINAL_SUMMARY JSON objects (large multi-line JSON at end)
            filtered = filtered.replace(/\{[\s\S]*?"FINAL_SUMMARY"[\s\S]*?\}/g, '');

            // Remove complete json code blocks
            filtered = filtered.replace(/```json\s*[\s\S]*?```/g, '');
            filtered = filtered.replace(/```\s*[\s\S]*?```/g, '');

            // Remove partial code blocks (during streaming) - any line starting with `
            filtered = filtered.replace(/^```[a-zA-Z]*\r?\n?/gm, '');
            filtered = filtered.replace(/^```\r?\n?/gm, '');

            // Remove progress update JSON objects (complete and partial)
            filtered = filtered.replace(/\{[\s\S]*?"message"[\s\S]*?"progress_update"[\s\S]*?\}/g, '');
            // Also remove partial JSON objects that look like progress updates
            filtered = filtered.replace(/\{["\s]*message["\s]*:/g, '');
            filtered = filtered.replace(/\{["\s]*type["\s]*:["\s]*progress_update/g, '');

            // Remove lines that are pure JSON-like (start with { or [ and end with } or ])
            filtered = filtered.replace(/^\s*\{[^\n]*\}\s*$/gm, '');
            filtered = filtered.replace(/^\s*\[[^\n]*\]\s*$/gm, '');

            // Remove any remaining partial JSON at end of content (during streaming)
            filtered = filtered.replace(/[\s\n]*\{[^}]*$/g, '');

            return filtered.trim();
          },

          onChunk: (chunk, displayContent, fullResponse, data) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? { ...m, content: displayContent }
                  : m
              )
            );
          },

          onProgressUpdate: (update: MarketProgressUpdateChunk | any) => {
            // Only process market-specific updates
            if (!('section' in update.data)) return;

            const { section, status, excerpt, partialData } = update.data as {
              section: string;
              status: string;
              excerpt: string;
              partialData?: {
                tam?: string | null;
                sam?: string | null;
                som?: string | null;
                trends?: Array<{ name: string; description: string; momentum?: string; impact?: string }>;
                competitors?: Array<{ name: string; strengths?: string | null; weaknesses?: string | null; marketShare?: string | null }>;
                opportunities?: string[];
                challenges?: string[];
              };
            };

            if (status === "gathering") {
              setActiveSectionId(section);
            }

            // Merge partial data into existing market analysis for real-time UI updates
            if (partialData && setMarketAnalysis) {
              const current = marketAnalysis || {
                tam: "",
                sam: "",
                som: "",
                trends: [],
                competitors: [],
                opportunities: [],
                challenges: []
              };
              const merged = { ...current };

              // Merge market size values
              if (partialData.tam) merged.tam = partialData.tam;
              if (partialData.sam) merged.sam = partialData.sam;
              if (partialData.som) merged.som = partialData.som;

              // Merge trends - add new trends or update existing ones
              if (partialData.trends && partialData.trends.length > 0) {
                const existingTrends = merged.trends || [];
                const newTrends = [...existingTrends];
                for (const trend of partialData.trends) {
                  const existingIndex = newTrends.findIndex((t: any) => t.name === trend.name);
                  if (existingIndex >= 0) {
                    newTrends[existingIndex] = {
                      ...newTrends[existingIndex],
                      name: trend.name,
                      description: trend.description,
                      momentum: (trend.momentum as "rising" | "stable" | "declining") || newTrends[existingIndex].momentum,
                      impact: (trend.impact as "high" | "medium" | "low") || newTrends[existingIndex].impact
                    } as any;
                  } else {
                    newTrends.push({
                      name: trend.name,
                      description: trend.description,
                      momentum: (trend.momentum as "rising" | "stable" | "declining") || "stable",
                      impact: (trend.impact as "high" | "medium" | "low") || "medium"
                    } as any);
                  }
                }
                merged.trends = newTrends as any;
              }

              // Merge competitors - add new or update existing
              if (partialData.competitors && partialData.competitors.length > 0) {
                const existingCompetitors = merged.competitors || [];
                const newCompetitors = [...existingCompetitors];
                for (const comp of partialData.competitors) {
                  const existingIndex = newCompetitors.findIndex((c: any) => c.name === comp.name);
                  if (existingIndex >= 0) {
                    newCompetitors[existingIndex] = {
                      ...newCompetitors[existingIndex],
                      ...(comp.strengths && { strengths: [comp.strengths] }),
                      ...(comp.weaknesses && { weaknesses: [comp.weaknesses] }),
                      ...(comp.marketShare && { marketShare: comp.marketShare })
                    };
                  } else {
                    newCompetitors.push({
                      name: comp.name,
                      strengths: comp.strengths ? [comp.strengths] : [],
                      weaknesses: comp.weaknesses ? [comp.weaknesses] : [],
                      marketShare: comp.marketShare || null
                    } as any);
                  }
                }
                merged.competitors = newCompetitors as any;
              }

              // Merge opportunities - add new ones avoiding duplicates
              if (partialData.opportunities && partialData.opportunities.length > 0) {
                const existingOpps = merged.opportunities || [];
                const newOpps = [...existingOpps];
                for (const opp of partialData.opportunities) {
                  if (!newOpps.includes(opp)) {
                    newOpps.push(opp);
                  }
                }
                merged.opportunities = newOpps as any;
              }

              // Merge challenges - add new ones avoiding duplicates
              if (partialData.challenges && partialData.challenges.length > 0) {
                const existingChallenges = merged.challenges || [];
                const newChallenges = [...existingChallenges];
                for (const challenge of partialData.challenges) {
                  if (!newChallenges.includes(challenge)) {
                    newChallenges.push(challenge);
                  }
                }
                merged.challenges = newChallenges as any;
              }

              // Set the merged data
              setMarketAnalysis(merged);
            }

            setMarketProgress((prev) => {
              const updated = prev.map((item) => {
                if (item.id === section) {
                  const wasGathering = item.status === "gathering";

                  if (wasGathering && status === "complete" && !item.isOptional) {
                    const messages = {
                      market_size: "Great! I have your market size. Now let's analyze market trends.",
                      trends: "Excellent! Trends captured. Moving to competitive landscape.",
                      competitors: "Perfect! Competition analyzed. Let's identify opportunities.",
                      opportunities: "Fantastic! Opportunities identified. Almost there!"
                    };
                    const message = messages[item.id as keyof typeof messages];
                    if (message) {
                      setCelebrationMessage(message);
                      setTimeout(() => setCelebrationMessage(null), 3000);
                    }
                  }

                  return {
                    ...item,
                    status: status as "gathering" | "awaiting_confirmation" | "complete",
                    excerpt: excerpt || item.excerpt,
                  };
                }
                return item;
              });

              setOverallProgress(calculateMarketProgress(updated));
              return updated;
            });
          },

          onComplete: (data, finalContent) => {
            if (data.type === 'summary') {
              const summary = data.data;
              setMarketAnalysis(summary);
              onSaveMarketAnalysis(summary);

              // Check if we were in edit mode
              if (editSection) {
                // Edit mode: only update the specific section, keep others as-is
                setMarketProgress((prev) => {
                  const updated = prev.map((item) => {
                    if (item.id === editSection) {
                      let excerpt = "";
                      switch (editSection) {
                        case "market_size":
                          excerpt = summary.tam || "";
                          break;
                        case "trends":
                          excerpt = `${summary.trends?.length || 0} trends`;
                          break;
                        case "competitors":
                          excerpt = `${summary.competitors?.length || 0} competitors`;
                          break;
                        case "opportunities":
                          excerpt = `${summary.opportunities?.length || 0} opportunities`;
                          break;
                        case "challenges":
                          excerpt = summary.challenges?.length ? `${summary.challenges.length} challenges` : "";
                          break;
                      }
                      return { ...item, status: "complete" as const, excerpt };
                    }
                    return item; // Keep other sections unchanged
                  });
                  setOverallProgress(calculateMarketProgress(updated));
                  setActiveSectionId(undefined);
                  return updated;
                });

                // Show edit-specific message, not completion message
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, content: `✅ Updated "${editSection}" section. Is there anything else you'd like to modify?` }
                      : m
                  )
                );
              } else {
                // Normal mode: mark all complete (existing behavior)
                const updatedProgress: MarketProgressItem[] = [
                  { ...defaultMarketProgress[0], status: "complete", excerpt: summary.tam },
                  { ...defaultMarketProgress[1], status: "complete", excerpt: `${summary.trends?.length || 0} trends` },
                  { ...defaultMarketProgress[2], status: "complete", excerpt: `${summary.competitors?.length || 0} competitors` },
                  { ...defaultMarketProgress[3], status: "complete", excerpt: `${summary.opportunities?.length || 0} opportunities` },
                  { ...defaultMarketProgress[4], status: summary.challenges?.length ? "complete" : "waiting", excerpt: summary.challenges?.length ? `${summary.challenges.length} challenges` : "" },
                ];

                setMarketProgress(updatedProgress);
                setOverallProgress(calculateMarketProgress(updatedProgress));
                setActiveSectionId(undefined);

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, content: "🎉 Market analysis complete! Your comprehensive market intelligence is ready. You can review the detailed findings on the right, then click 'Generate Ideas' to continue." }
                      : m
                  )
                );
              }
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId
                    ? { ...m, content: finalContent }
                    : m
                )
              );
            }
          },

          onError: (errorMessage) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: errorMessage }
                  : msg
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

  const progressTip = getMarketProgressTip(overallProgress, !!marketAnalysis, celebrationMessage);

  return (
    <div className="flex gap-4 h-full">
      {/* Chat Panel */}
      <div className="w-[420px] flex-shrink-0 border-r bg-muted/10 flex flex-col">
        {/* Chat Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
          <h2 className="text-sm font-medium">Market Consultant</h2>
          <span className="text-xs text-muted-foreground">Expert analysis</span>
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
          {/* Quick action chips */}
          {!isLoading && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Button
                onClick={async () => {
                  const generateMessage = "Generate comprehensive market analysis";
                  setInputValue("");
                  setIsLoading(true);
                  setLastUserMessage(generateMessage);

                  const userMsg: ChatMessage = {
                    id: Date.now().toString(),
                    role: "user",
                    content: "Generate comprehensive market analysis",
                    timestamp: Date.now(),
                  };
                  setMessages((prev) => [...prev, userMsg]);

                  try {
                    const response = await fetch("/api/ai/market/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        challenge: challenge,
                        conversationHistory: messages.map(({ id, ...rest }) => rest),
                      }),
                    });

                    const data = await response.json();
                    if (!data.success) throw new Error(data.error || "Failed to generate market analysis");

                    const marketAnalysis = data.data;
                    setMarketAnalysis(marketAnalysis);
                    onSaveMarketAnalysis(marketAnalysis);

                    const updatedProgress: MarketProgressItem[] = [
                      { ...defaultMarketProgress[0], status: "complete", excerpt: marketAnalysis.tam },
                      { ...defaultMarketProgress[1], status: "complete", excerpt: `${marketAnalysis.trends?.length || 0} trends` },
                      { ...defaultMarketProgress[2], status: "complete", excerpt: `${marketAnalysis.competitors?.length || 0} competitors` },
                      { ...defaultMarketProgress[3], status: "complete", excerpt: `${marketAnalysis.opportunities?.length || 0} opportunities` },
                      { ...defaultMarketProgress[4], status: marketAnalysis.challenges?.length ? "complete" : "waiting", excerpt: marketAnalysis.challenges?.length ? `${marketAnalysis.challenges.length} challenges` : "" },
                    ];

                    setMarketProgress(updatedProgress);
                    setOverallProgress(calculateMarketProgress(updatedProgress));
                    setActiveSectionId(undefined);

                    const aiMsg: ChatMessage = {
                      id: (Date.now() + 1).toString(),
                      role: "assistant",
                      content: `🎉 Comprehensive market analysis complete!

**Market Size:**
- TAM: ${marketAnalysis.tam}
- SAM: ${marketAnalysis.sam}
- SOM: ${marketAnalysis.som}

**Key Findings:**
- ${marketAnalysis.trends?.length || 0} market trends identified
- ${marketAnalysis.competitors?.length || 0} competitors analyzed
- ${marketAnalysis.opportunities?.length || 0} opportunities found

Your market intelligence is ready. Review the detailed analysis on the right, then click 'Generate Ideas' to continue.`,
                      timestamp: Date.now(),
                    };
                    setMessages((prev) => [...prev, aiMsg]);
                  } catch (error) {
                    console.error("Error generating market analysis:", error);
                    const errorMsg: ChatMessage = {
                      id: (Date.now() + 1).toString(),
                      role: "assistant",
                      content: "Sorry, I encountered an error generating the market analysis. Please try again.",
                      timestamp: Date.now(),
                    };
                    setMessages((prev) => [...prev, errorMsg]);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                size="sm"
                variant="outline"
                className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 hover:border-green-300 h-auto"
              >
                <Sparkles className="h-3 w-3" />
                Generate market analysis
              </Button>

              <Button
                onClick={() => {
                  if (marketAnalysis?.tam) {
                    setInputValue(`Current market size: TAM ${marketAnalysis.tam}, SAM ${marketAnalysis.sam}, SOM ${marketAnalysis.som}`);
                  } else {
                    setInputValue("What should I consider for market size (TAM, SAM, SOM)?");
                  }
                }}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Market size
              </Button>
              <Button
                onClick={() => {
                  if (marketAnalysis?.trends && marketAnalysis.trends.length > 0) {
                    setInputValue(`Current trends: ${marketAnalysis.trends.map((t: any) => t.name).join(", ")}`);
                  } else {
                    setInputValue("What market trends should I be aware of?");
                  }
                }}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Trends
              </Button>
              <Button
                onClick={() => {
                  if (marketAnalysis?.competitors && marketAnalysis.competitors.length > 0) {
                    setInputValue(`Current competitors: ${marketAnalysis.competitors.map((c: any) => c.name).join(", ")}`);
                  } else {
                    setInputValue("Who are the main competitors in this space?");
                  }
                }}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Competitors
              </Button>
              <Button
                onClick={() => {
                  if (marketAnalysis?.opportunities && marketAnalysis.opportunities.length > 0) {
                    setInputValue(`Current opportunities: ${marketAnalysis.opportunities.slice(0, 3).join("; ")}`);
                  } else {
                    setInputValue("What opportunities exist in this market?");
                  }
                }}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Opportunities
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Answer the consultant's questions..."
              className="min-h-[48px] max-h-[100px] resize-y text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
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

      {/* Market Progress Panel - Progress Cards initially, Full Preview when complete */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h1 className="text-sm font-semibold">
              {marketAnalysis ? "Market Analysis" : "Your Progress"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {marketAnalysis ? "Complete" : "Live Preview"}
            </span>
            <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="px-6 py-6">
            {/* Progress Overview */}
            {progressTip && !marketAnalysis && (
              <div className={`mb-6 flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
                progressTip.type === "celebration" || progressTip.type === "success"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  : overallProgress >= 75
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              }`}>
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{progressTip.text}</span>
              </div>
            )}

            {/* Always show market preview with progressive fill (like challenge phase) */}
            <div className="space-y-4">
              {/* Market Preview - Always visible, fills progressively via chat */}
              <MarketPreviewFromProgress
                challenge={challenge}
                marketProgress={marketProgress}
                overallProgress={overallProgress}
                marketAnalysis={marketAnalysis}
                activeSectionId={activeSectionId}
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        {(onBack || onContinue) && (
          <div className="flex-shrink-0 border-t bg-background/95 px-4 py-3">
            <WizardNav
              currentStep="market"
              onPrevious={onBack}
              onNext={onContinue}
              nextLabel="Generate Ideas"
              isNextDisabled={isContinueDisabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Market Preview From Progress Component
 * Shows the final market UI format based on current progress during interactive consultation
 */
interface MarketPreviewFromProgressProps {
  challenge: { problem: string; targetAudience: string; currentSolutions: string; industry?: string; context?: string };
  marketProgress: MarketProgressItem[];
  overallProgress: number;
  marketAnalysis?: any;
  activeSectionId?: string;
}

function MarketPreviewFromProgress({ challenge, marketProgress, overallProgress, marketAnalysis, activeSectionId }: MarketPreviewFromProgressProps) {
  const getMomentumIcon = (momentum: "rising" | "stable" | "declining") => {
    switch (momentum) {
      case "rising": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining": return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      case "stable": return <div className="h-4 w-4 bg-blue-500 rounded-full" />;
    }
  };

  const getStatusBadge = (status: MarketProgressItem["status"]) => {
    switch (status) {
      case "complete": return <Badge variant="default" className="bg-green-600">Complete</Badge>;
      case "gathering": return <Badge variant="outline" className="border-blue-500 text-blue-600">Gathering</Badge>;
      case "awaiting_confirmation": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Reviewing</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const marketSizeItem = marketProgress.find(item => item.id === "market_size");
  const trendsItem = marketProgress.find(item => item.id === "trends");
  const competitorsItem = marketProgress.find(item => item.id === "competitors");
  const opportunitiesItem = marketProgress.find(item => item.id === "opportunities");
  const challengesItem = marketProgress.find(item => item.id === "challenges");

  return (
    <div className="space-y-6">
      {/* Challenge Summary */}
      <Card>
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Your Challenge</h3>
              <p className="text-xs text-muted-foreground">Innovation context</p>
            </div>
          </div>
        </div>
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3 font-serif">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs uppercase tracking-wide">Problem:</span> {challenge.problem}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs uppercase tracking-wide">Target:</span> {challenge.targetAudience}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Market Size */}
      <Card className={activeSectionId === "market_size" ? "ring-2 ring-blue-500 ring-offset-2" : ""}>
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Market Size</h3>
                <p className="text-xs text-muted-foreground">Your addressable market opportunity</p>
              </div>
            </div>
            {marketSizeItem && getStatusBadge(
              marketAnalysis && marketAnalysis.tam && marketAnalysis.sam && marketAnalysis.som
                ? "complete"
                : marketSizeItem.status
            )}
          </div>
        </div>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 font-serif">
            {["TAM", "SAM", "SOM"].map((size, index) => (
              <div key={size} className="text-center p-4 rounded-md bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wide">{size}</p>
                <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {(() => {
                    // Use actual market analysis data if available
                    if (marketAnalysis) {
                      if (size === "TAM" && marketAnalysis.tam) {
                        const { value } = extractMarketValue(marketAnalysis.tam);
                        return value;
                      }
                      if (size === "SAM" && marketAnalysis.sam) {
                        const { value } = extractMarketValue(marketAnalysis.sam);
                        return value;
                      }
                      if (size === "SOM" && marketAnalysis.som) {
                        const { value } = extractMarketValue(marketAnalysis.som);
                        return value;
                      }
                    }

                    if (!marketSizeItem?.excerpt) return "—";
                    
                    const excerpt = marketSizeItem.excerpt;
                    
                    if (size === "TAM") {
                      // Try multiple patterns for TAM
                      const tamPatterns = [
                        /tam[^.]*?\$?([\d.]+)\s*(billion|million|b|m)/i,
                        /total addressable market[^.]*?\$?([\d.]+)\s*(billion|million|b|m)/i,
                        /\$?([\d.]+)\s*(billion|million|b|m).*?tam/i
                      ];
                      
                      for (const pattern of tamPatterns) {
                        const match = excerpt.match(pattern);
                        if (match) return `$${match[1]} ${match[2]}`;
                      }

                      return "—";
                    }
                    
                    if (size === "SAM") {
                      // Try multiple patterns for SAM
                      const samPatterns = [
                        /sam[^.]*?\$?([\d.]+)\s*(billion|million|b|m)/i,
                        /serviceable addressable market[^.]*?\$?([\d.]+)\s*(billion|million|b|m)/i,
                        /\$?([\d.]+)\s*(billion|million|b|m).*?sam/i
                      ];
                      
                      for (const pattern of samPatterns) {
                        const match = excerpt.match(pattern);
                        if (match) return `$${match[1]} ${match[2]}`;
                      }

                      return "—";
                    }

                    if (size === "SOM") {
                      // Try multiple patterns for SOM
                      const somPatterns = [
                        /som[^.]*?(\$?[\d.]+%?)/i,
                        /serviceable obtainable market[^.]*?(\$?[\d.]+%?)/i,
                        /(\d+%\s*(market share|revenue))/i,
                        /capture\s+(\d+%\s*of)/i
                      ];
                      
                      for (const pattern of somPatterns) {
                        const match = excerpt.match(pattern);
                        if (match) return match[1].includes("$") ? match[1] : `${match[1]}`;
                      }

                      return "—";
                    }

                    return "—";
                  })()}
                </p>
                {(() => {
                  // Add description for market analysis data
                  if (marketAnalysis) {
                    if (size === "TAM" && marketAnalysis.tam) {
                      const { description } = extractMarketValue(marketAnalysis.tam);
                      if (description && description !== marketAnalysis.tam) {
                        return <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-1.5 leading-tight">{description}</p>;
                      }
                    }
                    if (size === "SAM" && marketAnalysis.sam) {
                      const { description } = extractMarketValue(marketAnalysis.sam);
                      if (description && description !== marketAnalysis.sam) {
                        return <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-1.5 leading-tight">{description}</p>;
                      }
                    }
                    if (size === "SOM" && marketAnalysis.som) {
                      const { description } = extractMarketValue(marketAnalysis.som);
                      if (description && description !== marketAnalysis.som) {
                        return <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-1.5 leading-tight">{description}</p>;
                      }
                    }
                  }
                  return null;
                })()}
                <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1 font-medium leading-tight">
                  {size === "TAM" ? "Total Addressable Market" : size === "SAM" ? "Serviceable Addressable Market" : "Serviceable Obtainable Market"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Trends */}
      <Card className={activeSectionId === "trends" ? "ring-2 ring-blue-500 ring-offset-2" : ""}>
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Market Trends</h3>
                <p className="text-xs text-muted-foreground">Key trends shaping the industry</p>
              </div>
            </div>
            {trendsItem && getStatusBadge(trendsItem.status)}
          </div>
        </div>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 font-serif">
            {marketAnalysis?.trends && marketAnalysis.trends.length > 0 ? (
              marketAnalysis.trends.map((trend: any, index: number) => (
                <div key={index} className="p-4 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">{trend.name}</h4>
                    <div className="flex items-center gap-2">
                      {getMomentumIcon(trend.momentum)}
                      <Badge variant="outline" className={
                        trend.impact === "high" ? "border-red-200 text-red-700 dark:text-red-400" :
                        trend.impact === "medium" ? "border-yellow-200 text-yellow-700 dark:text-yellow-400" :
                        "border-gray-200 text-gray-700 dark:text-gray-400"
                      }>
                        {trend.impact} impact
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{trend.description}</p>
                </div>
              ))
            ) : trendsItem?.status !== "waiting" ? (
              <>
                <div className="p-4 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                      {trendsItem?.excerpt || "—"}
                    </h4>
                    <div className="flex items-center gap-2">
                      {getMomentumIcon("rising")}
                      <Badge variant="outline" className="border-blue-200 text-blue-700 dark:text-blue-400">
                        analyzing
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    Gathering market intelligence through expert consultation...
                  </p>
                </div>
                <div className="p-4 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 flex items-center justify-center text-center">
                  <div className="text-neutral-500 dark:text-neutral-400">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Additional trends will be identified during consultation</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-2 p-8 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">—</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competitors */}
      <Card className={activeSectionId === "competitors" ? "ring-2 ring-blue-500 ring-offset-2" : ""}>
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Competitive Landscape</h3>
                <p className="text-xs text-muted-foreground">Key players in your market</p>
              </div>
            </div>
            {competitorsItem && getStatusBadge(competitorsItem.status)}
          </div>
        </div>
        <CardContent>
          {marketAnalysis?.competitors && marketAnalysis.competitors.length > 0 ? (
            <div className="space-y-4 font-serif">
              {marketAnalysis.competitors.map((competitor: any, index: number) => (
                <div key={index} className="p-5 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{competitor.name}</h4>
                    {competitor.marketShare && (
                      <Badge variant="outline" className="font-medium">{competitor.marketShare}</Badge>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {competitor.strengths?.map?.((strength: any, i: number) => (
                          <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        )) || <li className="text-sm text-neutral-500">No strengths data available</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                        <X className="h-3 w-3" /> Weaknesses
                      </p>
                      <ul className="space-y-1">
                        {competitor.weaknesses?.map?.((weakness: any, i: number) => (
                          <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{weakness}</span>
                          </li>
                        )) || <li className="text-sm text-neutral-500">No weaknesses data available</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : competitorsItem?.status !== "waiting" ? (
            <div className="space-y-4 font-serif">
              <div className="p-5 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                    Competitive Analysis
                  </h4>
                  <Badge variant="outline" className="font-medium">In Progress</Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Analysis Status
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      {competitorsItem?.excerpt || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Consultation Progress
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      Market consultant gathering competitor data through targeted questions...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">—</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunities & Challenges */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={activeSectionId === "opportunities" ? "ring-2 ring-blue-500 ring-offset-2" : ""}>
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Opportunities</h3>
                  <p className="text-xs text-muted-foreground">Growth areas</p>
                </div>
              </div>
              {opportunitiesItem && getStatusBadge(opportunitiesItem.status)}
            </div>
          </div>
          <CardContent className="pt-6">
            <ul className="space-y-3 font-serif">
              {marketAnalysis?.opportunities && marketAnalysis.opportunities.length > 0 ? (
                marketAnalysis.opportunities.map((opportunity: any, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <div className="h-6 w-6 rounded-md bg-emerald-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{opportunity}</span>
                  </li>
                ))
              ) : opportunitiesItem?.status !== "waiting" ? (
                <>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <div className="h-6 w-6 rounded-md bg-emerald-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {opportunitiesItem?.excerpt || "—"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 opacity-60">
                    <div className="h-6 w-6 rounded-md bg-neutral-300 dark:bg-neutral-700 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <div className="h-3 w-3 rounded-full border-2 border-neutral-400 dark:border-neutral-500" />
                    </div>
                    <span className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Additional opportunities will be identified during consultation
                    </span>
                  </li>
                </>
              ) : (
                <li className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                  <div className="h-6 w-6 rounded-md bg-neutral-300 dark:bg-neutral-700 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <div className="h-3 w-3 rounded-full border-2 border-neutral-400 dark:border-neutral-500" />
                  </div>
                  <span className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    —
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {challengesItem && (
          <Card className={activeSectionId === "challenges" ? "ring-2 ring-blue-500 ring-offset-2" : ""}>
            <div className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Challenges</h3>
                    <p className="text-xs text-muted-foreground">Potential obstacles</p>
                  </div>
                </div>
                {getStatusBadge(challengesItem.status)}
              </div>
            </div>
            <CardContent className="pt-6">
              <ul className="space-y-3 font-serif">
                {marketAnalysis?.challenges && marketAnalysis.challenges.length > 0 ? (
                  marketAnalysis.challenges.map((challenge: any, index: number) => (
                    <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                      <div className="h-6 w-6 rounded-md bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <AlertTriangle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{challenge}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <div className="h-6 w-6 rounded-md bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {challengesItem.excerpt || "—"}
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overall Progress Indicator */}
      {overallProgress < 100 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Market Analysis in Progress
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  This is a live preview of your market analysis. Continue the consultation with the market analyst on the left to fill in all sections and complete your comprehensive market intelligence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}