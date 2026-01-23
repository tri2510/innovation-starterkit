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
import { Send, Loader2, Sparkles, Lightbulb, BarChart3, ChevronDown, ChevronUp, TrendingUp, Users, Target, Zap, CheckCircle2, Circle } from "lucide-react";
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
    // If clicking the same idea that's already selected, just update selection without adding message
    if (selectedIdeaId === ideaId) {
      return;
    }

    setSelectedIdeaId(ideaId);
    saveConversationHistory("ideation", messages);

    const selectedIdea = ideas.find((i) => i.id === ideaId);
    if (selectedIdea) {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Selected "${selectedIdea.name}". Ready for investment appraisal? Click "Investment Appraisal" to continue, or ask me anything about this idea.`,
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
              setIdeas(data.data.ideas);
              saveIdeas(data.data.ideas);
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
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-purple-600" />
            <h1 className="text-sm font-semibold">
              {ideas.length > 0 ? "Your Ideas" : "Generate Ideas"}
            </h1>
            {ideas.length > 0 && (
              <Badge variant="secondary" className="text-xs">{ideas.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {isGenerating ? "Generating..." : ideas.length > 0 ? "Ready" : "Waiting"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="px-6 py-6 space-y-6">
            {/* Progress Tip */}
            {progressTip && (
              <div className={cn(
                "flex items-center gap-2 text-sm px-4 py-3 rounded-lg",
                progressTip.type === "success" && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
                progressTip.type !== "success" && "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              )}>
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{progressTip.text}</span>
              </div>
            )}

            {/* Market Context Card */}
            <Card className="border-2">
              <div className="px-5 py-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsMarketExpanded(!isMarketExpanded)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <BarChart3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold">Market Context</span>
                    <Badge variant="outline" className="text-xs">TAM: {extractMarketValue(marketAnalysis?.tam || "N/A").value}</Badge>
                  </div>
                  {isMarketExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              {isMarketExpanded && (
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-3 font-serif mb-4">
                    {["TAM", "SAM", "SOM"].map((size) => {
                      const value = size === "TAM" ? marketAnalysis?.tam : size === "SAM" ? marketAnalysis?.sam : marketAnalysis?.som;
                      const { value: displayValue, description } = extractMarketValue(value || "N/A");
                      return (
                        <div key={size} className="text-center p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                          <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1">{size}</p>
                          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{displayValue}</p>
                          {description && description !== value && (
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-1.5 leading-relaxed">{description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {marketAnalysis?.trends && marketAnalysis.trends.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                        Key Trends
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {marketAnalysis.trends.slice(0, 3).map((trend: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">{trend.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Ideas Grid */}
            {ideas.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Lightbulb className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No ideas yet. Click "Generate Ideas" to start.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {ideas.map((idea) => {
                  const isSelected = selectedIdeaId === idea.id;
                  return (
                    <Card
                      key={idea.id}
                      className={cn(
                        "cursor-pointer transition-all overflow-hidden border-2",
                        isSelected ? "ring-2 ring-purple-500 ring-offset-2 border-purple-300" : "border-neutral-200 hover:border-purple-300 hover:shadow-md"
                      )}
                      onClick={() => handleSelectIdea(idea.id)}
                    >
                      <div className={cn(
                        "px-4 py-3 border-b",
                        isSelected ? "bg-purple-50 dark:bg-purple-950/30" : "bg-neutral-50 dark:bg-neutral-900/30"
                      )}>
                        <div className="flex items-start gap-2">
                          {isSelected ? (
                            <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-4 w-4 text-neutral-300 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{idea.name}</h3>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{idea.tagline}</p>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{idea.description}</p>
                        {/* Problem Solved */}
                        <div className="flex items-start gap-2">
                          <Target className="h-3.5 w-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-neutral-600 dark:text-neutral-400 text-xs">Problem Solved</p>
                            <p className="text-neutral-700 dark:text-neutral-300 text-xs">{idea.problemSolved}</p>
                          </div>
                        </div>
                        {/* Strategic Focus Areas */}
                        {idea.searchFields && (
                          <div>
                            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Strategic Focus Areas</p>
                            <div className="flex flex-wrap gap-1.5">
                              {idea.searchFields.industries?.map((industry, index) => (
                                <Badge key={`ind-${index}`} variant="outline" className="text-xs">
                                  {industry}
                                </Badge>
                              ))}
                              {idea.searchFields.technologies?.map((tech, index) => (
                                <Badge key={`tech-${index}`} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
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
