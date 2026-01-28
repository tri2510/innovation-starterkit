/**
 * Interactive Ideation Component
 * Handles the chat-based idea generation consultation
 * Focused on generating ideas without scoring during generation
 */

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, Lightbulb, BarChart3, ChevronDown, ChevronUp, TrendingUp, Users, Target, Zap, CheckCircle2, Circle, Check, X } from "lucide-react";
import { streamChatResponse } from "@/hooks/use-chat-streaming";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatMessageWithRetry } from "@/components/chat/chat-message";
import { Badge } from "@/components/ui/badge";
import { WizardNav } from "@/components/wizard/wizard-nav";
import type { ChatMessage, Challenge, MarketAnalysis, BusinessIdea } from "@/types/innovation";
import { saveIdeas, saveConversationHistory, setStep } from "@/lib/session";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  defaultIdeateProgress,
  calculateIdeateProgress,
  getIdeateProgressTip,
  type IdeateProgressItem
} from "@/lib/ideate-utils";
import { IdeaDetailView } from "./idea-detail-view";

interface InteractiveIdeationProps {
  challenge: Challenge;
  marketAnalysis: MarketAnalysis;
  ideas: BusinessIdea[];
  setIdeas: (ideas: BusinessIdea[]) => void;
  selectedIdeaId: string | null;
  setSelectedIdeaId: (id: string) => void;
  onBack?: () => void;
  onContinue?: () => void;
  isContinueDisabled?: boolean;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export function InteractiveIdeation({
  challenge,
  marketAnalysis,
  ideas,
  setIdeas,
  selectedIdeaId,
  setSelectedIdeaId,
  onBack,
  onContinue,
  isContinueDisabled = false,
  initialMessages,
  onMessagesChange
}: InteractiveIdeationProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [ideateProgress, setIdeateProgress] = useState<IdeateProgressItem[]>(defaultIdeateProgress);
  const [overallProgress, setOverallProgress] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMarketExpanded, setIsMarketExpanded] = useState(false);
  const [selectedIdeaForView, setSelectedIdeaForView] = useState<BusinessIdea | null>(null);
  const [isDetailView, setIsDetailView] = useState(false);

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

  // Initialize greeting
  useEffect(() => {
    if (messages.length === 0) {
      const hasIdeas = ideas && ideas.length > 0;
      const hasSelection = !!selectedIdeaId;

      let greetingMessage: ChatMessage;

      if (hasSelection) {
        const selected = ideas.find((i) => i.id === selectedIdeaId);
        greetingMessage = {
          id: "greeting",
          role: "assistant",
          content: `You've selected "${selected?.name}". This idea is ready for the investment appraisal phase. You can continue exploring other ideas or click "Investment Appraisal" to analyze the financial projections.`,
          timestamp: Date.now(),
        };
      } else if (hasIdeas) {
        greetingMessage = {
          id: "greeting",
          role: "assistant",
          content: `I've generated ${ideas.length} innovative ideas for "${challenge.problem.substring(0, 40)}...". Browse through them, click to select your favorite, or ask me to refine specific concepts.`,
          timestamp: Date.now(),
        };
      } else {
        greetingMessage = {
          id: "greeting",
          role: "assistant",
          content: `I'm your innovation consultant. Based on your challenge about "${challenge.problem.substring(0, 40)}..." and the market analysis (TAM: ${marketAnalysis.tam || "N/A"}), I can generate tailored business ideas.

Click "Generate Ideas" to get started, or tell me if you have specific concepts in mind.`,
          timestamp: Date.now(),
        };
      }
      setMessages([greetingMessage]);
    }
  }, [challenge.problem, ideas.length, messages.length, selectedIdeaId]);

  const visibleMessages = useMemo(() => {
    return messages.filter((m) => {
      if (m.role === "user") return true;
      return m.content && m.content.trim().length > 0;
    });
  }, [messages]);

  const extractMarketValue = (text: string): { value: string; description: string } => {
    if (!text || typeof text !== 'string') {
      return { value: 'N/A', description: 'No data available' };
    }
    const valueMatch = text.match(/\$?[\d.]+[BMK]\b/i);
    const value = valueMatch ? valueMatch[0] : text;
    let description = text.replace(value, '').trim();
    description = description.replace(/^[-:]\s*/, '').trim();
    return { value, description };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    if (lastUserMessage.trim() && !isLoading) {
      setInputValue(lastUserMessage);
      // handleSendMessage will be triggered by the user or we could call it directly
      // For now, just set the input value so user can resend
    }
  };

  const handleSelectIdea = (ideaId: string) => {
    // In grid mode, clicking an idea switches to detail view
    const selectedIdea = ideas.find((i) => i.id === ideaId);
    if (selectedIdea) {
      setSelectedIdeaForView(selectedIdea);
      setIsDetailView(true);
    }
  };

  const handleViewIdea = (ideaId: string) => {
    // Update right panel view without changing mode
    const selectedIdea = ideas.find((i) => i.id === ideaId);
    if (selectedIdea) {
      setSelectedIdeaForView(selectedIdea);
    }
  };

  const handleCloseDetailMode = () => {
    setIsDetailView(false);
    setSelectedIdeaForView(null);
  };

  const handleConfirmIdeaSelection = (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    saveConversationHistory("ideation", messages);

    const selectedIdea = ideas.find((i) => i.id === ideaId);
    if (selectedIdea) {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Selected "${selectedIdea.name}". This idea has ${selectedIdea.metrics?.uniqueness ? Math.round(selectedIdea.metrics.uniqueness) : 'N/A'}% uniqueness and ${selectedIdea.metrics?.feasibility ? Math.round(selectedIdea.metrics.feasibility) : 'N/A'}% feasibility.

You can:
- Continue exploring other ideas
- Click "Investment Appraisal" to see detailed financial projections
- Ask me to compare ideas or explain specific metrics`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
    }
  };

  const generateInitialIdeas = async () => {
    setInputValue("");
    setIsLoading(true);
    setIsGenerating(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: "Generate innovative business ideas",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Update progress for exploration
    setIdeateProgress(prev => {
      const updated = prev.map(item =>
        item.id === "exploration" ? { ...item, status: "gathering" as const } : item
      );
      setOverallProgress(calculateIdeateProgress(updated));
      return updated;
    });

    const aiMessageId = "ai-" + Date.now();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const response = await fetch("/api/ai/ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: {
            problem: challenge?.problem || "",
            targetAudience: challenge?.targetAudience || "",
            currentSolutions: challenge?.currentSolutions || "",
          },
          marketAnalysis: {
            tam: marketAnalysis?.tam || "",
            sam: marketAnalysis?.sam || "",
            som: marketAnalysis?.som || "",
            trends: marketAnalysis?.trends || [],
            competitors: marketAnalysis?.competitors || [],
            opportunities: marketAnalysis?.opportunities || [],
            challenges: marketAnalysis?.challenges || [],
          },
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to generate ideas");
      if (!Array.isArray(data.data)) throw new Error("Invalid response format");

      setIdeas(data.data);
      saveIdeas(data.data);

      // Mark all progress as complete
      const updatedProgress: IdeateProgressItem[] = [
        { id: "exploration", label: "Exploring Concepts", status: "complete" },
        { id: "divergent", label: "Generating Ideas", status: "complete" },
        { id: "refinement", label: "Refining Concepts", status: "complete" },
        { id: "finalization", label: "Finalizing Ideas", status: "complete", ideaCount: data.data.length },
      ];
      setIdeateProgress(updatedProgress);
      setOverallProgress(calculateIdeateProgress(updatedProgress));

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Generated ${data.data.length} innovative ideas for your challenge!

Each idea addresses the problem: "${challenge.problem}"

Browse through the ideas on the right, hover to preview, and click to select your favorite. You can also ask me to refine specific concepts or generate more alternatives.`,
        timestamp: Date.now(),
      };
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMessageId ? aiMsg : m))
      );
    } catch (error) {
      console.error("Error generating ideas:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: "Sorry, I encountered an error generating ideas. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    setLastUserMessage(inputValue);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    const aiMsgId = "ai-" + Date.now();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      await streamChatResponse("/api/assistant/ideation",
        {
          userInput: inputValue,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          challenge: challenge,
          marketAnalysis: marketAnalysis,
          ideas: ideas,
          selectedIdea: selectedIdeaId ? ideas.find((i) => i.id === selectedIdeaId) : null,
          viewingIdea: selectedIdeaForView || null,
        },
        {
          filterDisplayContent: (content) => {
            // Check if there's an IDEAS_UPDATE or MARKET_UPDATE block
            const hasIdeasUpdate = content.includes("IDEAS_UPDATE");
            const hasMarketUpdate = content.includes("MARKET_UPDATE");

            if (hasIdeasUpdate || hasMarketUpdate) {
              // If there's an update block, remove everything from the start up to and including the JSON block
              let filtered = content;
              filtered = filtered.replace(/[\s\S]*?```json\s*[\s\S]*?IDEAS_UPDATE[\s\S]*?\n```/g, "");
              filtered = filtered.replace(/[\s\S]*?```json\s*[\s\S]*?MARKET_UPDATE[\s\S]*?\n```/g, "");
              filtered = filtered.replace(/[\s\S]*?Here's the updated data[\s\S]*?IDEAS/g, "");
              filtered = filtered.replace(/[\s\S]*?Here is the updated data[\s\S]*?IDEAS/g, "");
              filtered = filtered.replace(/Here['']?s? the updated data for your appraisal:?[\s\S]*?```/gi, "");
              return filtered.trim();
            }
            return content;
          },

          onChunk: (chunk, displayContent) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: displayContent } : msg
              )
            );
          },

          onComplete: (data, finalContent) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: finalContent || "" } : msg
              )
            );
            if (data.type === "update" && data.data?.ideas) {
              // Clear financial previews from all ideas since they may have been modified
              const clearedIdeas = data.data.ideas.map((idea: BusinessIdea) => ({
                ...idea,
                financialPreview: undefined,
              }));
              setIdeas(clearedIdeas);
              saveIdeas(clearedIdeas);
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

      saveConversationHistory("ideation", [...messages, userMsg, aiMsg]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: "Sorry, I couldn't process that. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const progressTip = getIdeateProgressTip(overallProgress, ideas.length > 0, ideas.length, isGenerating);

  return (
    <div className="flex gap-4 h-full">
      {/* Chat Panel */}
      <div className="w-[420px] flex-shrink-0 border-r bg-muted/10 flex flex-col">
        {/* Chat Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
          <h2 className="text-sm font-medium">Innovation Consultant</h2>
          <span className="text-xs text-muted-foreground">Idea generation</span>
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
                onClick={generateInitialIdeas}
                size="sm"
                variant="outline"
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 hover:border-purple-300 h-auto"
              >
                <Sparkles className="h-3 w-3" />
                Generate Ideas
              </Button>
              <Button
                onClick={() => setInputValue(ideas.length > 0 ? `Generate 3 more alternatives to: ${ideas[0]?.name}` : "Generate more alternative ideas")}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                More alternatives
              </Button>
              <Button
                onClick={() => setInputValue(ideas.length > 0 ? `Compare these ideas: ${ideas.map(i => i.name).join(", ")}` : "Compare the generated ideas")}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                Compare ideas
              </Button>
              <Button
                onClick={() => setInputValue("Make these ideas more innovative and disruptive")}
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 h-auto text-xs"
              >
                More innovative
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={selectedIdeaId ? "Ask about this idea..." : ideas.length > 0 ? "Ask to compare, refine, or explore..." : "Ask to generate ideas..."}
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

      {/* Ideas Display Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isDetailView ? (
          /* GRID MODE - 3 Column Layout */
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <h1 className="text-lg font-bold">
                    {ideas.length > 0 ? "Your Ideas" : "Generate Ideas"}
                  </h1>
                  {ideas.length > 0 && (
                    <Badge variant="secondary" className="text-sm">{ideas.length}</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {isGenerating ? "Generating..." : ideas.length > 0 ? "Ready" : "Waiting"}
                </span>
              </div>

              {/* Progress Tip */}
              {progressTip && (
                <div className={cn(
                  "flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-4",
                  progressTip.type === "success" && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
                  progressTip.type !== "success" && "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                )}>
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{progressTip.text}</span>
                </div>
              )}

              {/* Ideas Grid */}
              {ideas.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No ideas yet. Click "Generate Ideas" to start.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ideas.map((idea) => {
                    const isConfirmed = selectedIdeaId === idea.id;
                    const uniquenessScore = Math.round(idea.metrics?.uniqueness || 70);
                    const feasibilityScore = Math.round(idea.metrics?.feasibility || 70);

                    const getScoreColor = (score: number) => {
                      if (score >= 80) return 'text-green-700 dark:text-green-300';
                      if (score >= 60) return 'text-yellow-700 dark:text-yellow-300';
                      return 'text-red-700 dark:text-red-300';
                    };

                    return (
                      <Card
                        key={idea.id}
                        className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-300 relative"
                        onClick={() => handleSelectIdea(idea.id)}
                      >
                        {/* Select Button - Top Right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmIdeaSelection(idea.id);
                          }}
                          className="absolute top-3 right-3 z-10 transition-all hover:scale-110"
                          title={isConfirmed ? "Selected for appraisal" : "Select for appraisal"}
                        >
                          {isConfirmed ? (
                            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full border-2 border-purple-400 bg-white hover:border-purple-600 flex items-center justify-center shadow-sm" />
                          )}
                        </button>

                        <div className="p-5 space-y-3">
                          {/* Header */}
                          <div className="flex items-start gap-3 pr-10">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                              <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold leading-tight mb-1">
                                {idea.name}
                              </h3>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                {idea.tagline}
                              </p>
                            </div>
                          </div>

                        {/* Description */}
                        <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 line-clamp-3">
                          {idea.description}
                        </p>

                        {/* Compact Metrics */}
                        {idea.metrics && (
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className={cn("font-medium", getScoreColor(uniquenessScore))}>
                              {uniquenessScore}% unique
                            </span>
                            <span className="text-neutral-400">•</span>
                            <span className={cn("font-medium", getScoreColor(feasibilityScore))}>
                              {feasibilityScore}% feasible
                            </span>
                          </div>
                        )}

                      </div>
                    </Card>
                  );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* DETAIL MODE - LinkedIn-style Layout */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Sidebar - Compact Idea List */}
            <div className="flex-shrink-0 border-r bg-muted/5 flex flex-col w-full lg:w-[280px]">
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                  <h1 className="text-sm font-semibold">Your Ideas</h1>
                  <Badge variant="secondary" className="text-xs">{ideas.length}</Badge>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {ideas.map((idea) => {
                  const uniquenessScore = Math.round(idea.metrics?.uniqueness || 70);
                  const feasibilityScore = Math.round(idea.metrics?.feasibility || 70);

                  const getScoreColor = (score: number) => {
                    if (score >= 80) return 'text-green-700 dark:text-green-300';
                    if (score >= 60) return 'text-yellow-700 dark:text-yellow-300';
                    return 'text-red-700 dark:text-red-300';
                  };

                  return (
                    <Card
                      key={idea.id}
                      className={cn(
                        "cursor-pointer transition-all overflow-hidden border relative group",
                        "hover:shadow-md",
                        selectedIdeaForView?.id === idea.id
                          ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-purple-300"
                      )}
                      onClick={() => handleViewIdea(idea.id)}
                    >
                      {/* Selection Indicator */}
                      {selectedIdeaForView?.id === idea.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                      )}

                      {/* Card Content */}
                      <div className="p-3">
                        <h3 className={cn(
                          "text-xs font-bold leading-tight mb-1",
                          selectedIdeaForView?.id === idea.id ? "text-purple-900 dark:text-purple-100" : "text-neutral-900 dark:text-neutral-100"
                        )}>
                          {idea.name}
                        </h3>
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {idea.tagline}
                        </p>

                        {/* Quick Metrics */}
                        {idea.metrics && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className={cn("text-[10px] font-medium", getScoreColor(uniquenessScore))}>
                              {uniquenessScore}% unique
                            </span>
                            <span className="text-[10px] text-neutral-400">•</span>
                            <span className={cn("text-[10px] font-medium", getScoreColor(feasibilityScore))}>
                              {feasibilityScore}% feasible
                            </span>
                          </div>
                        )}

                        {/* Selected Badge */}
                        {selectedIdeaId === idea.id && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                            <Check className="h-3 w-3" />
                            Selected
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Detailed View */}
            {selectedIdeaForView && (
              <div className="flex-1 bg-background flex flex-col">
                {/* Mobile Back Button */}
                <div className="lg:hidden flex-shrink-0 px-4 py-2 border-b bg-background/95 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseDetailMode}
                    className="text-xs"
                  >
                    ← Back to grid
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <IdeaDetailView
                    idea={selectedIdeaForView}
                    marketAnalysis={marketAnalysis}
                    allIdeas={ideas}
                    onClose={handleCloseDetailMode}
                    onSelect={handleConfirmIdeaSelection}
                    selectedIdeaId={selectedIdeaId}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fixed Bottom Navigation - Same for both modes */}
        {(onBack || onContinue) && (
          <div className="flex-shrink-0 border-t bg-background/95 px-4 py-3">
            <WizardNav
              currentStep="ideation"
              onPrevious={onBack}
              onNext={onContinue}
              nextLabel="Investment Appraisal"
              isNextDisabled={isContinueDisabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
