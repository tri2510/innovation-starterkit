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
import { Send, Loader2, Sparkles, Lightbulb, Target, Check } from "lucide-react";
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
  const [scoringIdeaId, setScoringIdeaId] = useState<string | null>(null);
  const [isScoringAll, setIsScoringAll] = useState(false);

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

  // Track the previous ideas array to detect replacements
  const prevIdeasRef = useRef<BusinessIdea[]>([]);
  const [replacementIdeaId, setReplacementIdeaId] = useState<string | null>(null);

  // Auto-update detail view when ideas change (e.g., when scores are regenerated via chat)
  useEffect(() => {
    if (selectedIdeaForView && ideas.length > 0) {
      const updatedIdea = ideas.find((i) => i.id === selectedIdeaForView.id);

      if (updatedIdea) {
        // Idea still exists - check if it has meaningful updates
        if (updatedIdea !== selectedIdeaForView) {
          const hasNewMetrics =
            (updatedIdea.metrics && !selectedIdeaForView.metrics) ||
            (updatedIdea.evaluation && !selectedIdeaForView.evaluation) ||
            (updatedIdea.metrics && selectedIdeaForView.metrics &&
              (updatedIdea.metrics.uniqueness !== selectedIdeaForView.metrics.uniqueness ||
               updatedIdea.metrics.feasibility !== selectedIdeaForView.metrics.feasibility));

          if (hasNewMetrics) {
            setSelectedIdeaForView(updatedIdea);
          }
        }
      } else {
        // Idea no longer exists (was replaced or removed)
        // Try to find the replacement idea by comparing with previous ideas
        const prevIdeaIds = new Set(prevIdeasRef.current.map(i => i.id));
        const newIdeas = ideas.filter(i => !prevIdeaIds.has(i.id));

        if (newIdeas.length > 0 && replacementIdeaId) {
          // Use the tracked replacement idea
          const replacement = ideas.find(i => i.id === replacementIdeaId);
          if (replacement) {
            setSelectedIdeaForView(replacement);
            setReplacementIdeaId(null);
            return;
          }
        }

        // Fallback: Select the first available idea or clear selection
        if (ideas.length > 0) {
          setSelectedIdeaForView(ideas[0]);
        } else {
          setSelectedIdeaForView(null);
        }
      }
    }

    // Update prevIdeasRef for next comparison
    prevIdeasRef.current = ideas;
  }, [ideas, selectedIdeaForView, replacementIdeaId]);

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
        const needsScoring = ideas.some(i => !i.metrics);
        greetingMessage = {
          id: "greeting",
          role: "assistant",
          content: `I've generated ${ideas.length} innovative ideas for "${challenge.problem.substring(0, 40)}..."${needsScoring ? '. Click on an idea to view details and generate scores when ready.' : '. Browse through the list, click to view details, and select your favorite.'} You can also ask me to refine specific concepts.`,
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

  const handleViewIdea = (ideaId: string) => {
    const selectedIdea = ideas.find((i) => i.id === ideaId);
    if (selectedIdea) {
      setSelectedIdeaForView(selectedIdea);
    }
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

  const handleGenerateScores = async (ideaId: string, scoreAll: boolean = false) => {
    setScoringIdeaId(ideaId);
    if (scoreAll) setIsScoringAll(true);

    try {
      let ideasToScore;
      let scoreAllMode = false;

      if (scoreAll) {
        // Score all unscored ideas
        const unscoredIdeas = ideas.filter((idea) => !idea.metrics);
        ideasToScore = unscoredIdeas.length > 0 ? unscoredIdeas : [ideas.find((i) => i.id === ideaId)!];
        scoreAllMode = true;
      } else {
        // Score only this specific idea
        const idea = ideas.find((i) => i.id === ideaId);
        ideasToScore = idea ? [idea] : [];
      }

      const BATCH_SIZE = 3; // Score in batches of 3 to avoid timeout
      let allScoredIdeas: any[] = [];
      let currentIdeas = ideas;

      // Helper function to score a batch
      const scoreBatch = async (batch: any[]) => {
        const response = await fetch("/api/ai/ideate/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ideas: batch,
            challenge: challenge,
            marketAnalysis: marketAnalysis,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error("Failed to score ideas");
        }

        return data.data;
      };

      if (ideasToScore.length <= BATCH_SIZE) {
        // Single batch - no progress messages needed
        allScoredIdeas = await scoreBatch(ideasToScore);
      } else {
        // Multiple batches - show progress
        const totalBatches = Math.ceil(ideasToScore.length / BATCH_SIZE);

        for (let i = 0; i < ideasToScore.length; i += BATCH_SIZE) {
          const batch = ideasToScore.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;
          const startIdx = i + 1;
          const endIdx = Math.min(i + BATCH_SIZE, ideasToScore.length);

          // Show progress message
          const progressMsg: ChatMessage = {
            id: `progress-${Date.now()}`,
            role: "assistant",
            content: `Scoring ideas ${startIdx}-${endIdx} of ${ideasToScore.length}...`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, progressMsg]);

          // Score this batch
          const batchScores = await scoreBatch(batch);
          allScoredIdeas = [...allScoredIdeas, ...batchScores];

          // Update ideas with scores from this batch
          currentIdeas = currentIdeas.map((idea) => {
            const scored = batchScores.find((s: any) => s.id === idea.id);
            return scored
              ? { ...idea, metrics: scored.metrics, evaluation: scored.evaluation }
              : idea;
          });

          setIdeas(currentIdeas);
          saveIdeas(currentIdeas);
        }
      }

      const scoredIdeas = allScoredIdeas;

      // Update all ideas with their new scores (for single batch case)
      if (ideasToScore.length <= BATCH_SIZE) {
        const updatedIdeas = ideas.map((idea) => {
          const scored = scoredIdeas.find((s: any) => s.id === idea.id);
          return scored
            ? { ...idea, metrics: scored.metrics, evaluation: scored.evaluation }
            : idea;
        });

        setIdeas(updatedIdeas);
        saveIdeas(updatedIdeas);
        currentIdeas = updatedIdeas;
      }

      // Update the selected idea for view
      setSelectedIdeaForView(currentIdeas.find((i) => i.id === ideaId) || null);

      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: scoreAllMode
          ? `Generated scores for ${scoredIdeas.length} idea${scoredIdeas.length > 1 ? 's' : ''}!

${scoredIdeas.map((scored: any) => {
  const idea = currentIdeas.find((i) => i.id === scored.id);
  return `• "${idea?.name}": ${Math.round(scored.metrics.uniqueness)}% unique, ${Math.round(scored.metrics.feasibility)}% feasible`;
}).join('\n')}

You can ask me to explain these metrics or suggest improvements to increase the scores.`
          : `Generated scores for "${currentIdeas.find((i) => i.id === ideaId)?.name}"!

- Uniqueness: ${Math.round(scoredIdeas[0].metrics.uniqueness)}%
- Feasibility: ${Math.round(scoredIdeas[0].metrics.feasibility)}%
- Innovation: ${Math.round(scoredIdeas[0].metrics.innovation)}%
- Market Fit: ${Math.round(scoredIdeas[0].metrics.marketFit)}%
- ROI: ${scoredIdeas[0].metrics.roi}
- Risk: ${scoredIdeas[0].metrics.risk}

You can ask me to explain these metrics or suggest improvements to increase the scores.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
    } catch (error) {
      console.error("Error generating scores:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error generating scores. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setScoringIdeaId(null);
      setIsScoringAll(false);
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
          skipEvaluation: true, // Skip evaluation for faster generation
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to generate ideas");
      if (!Array.isArray(data.data)) throw new Error("Invalid response format");

      setIdeas(data.data);
      saveIdeas(data.data);

      // Auto-select first idea for viewing
      if (data.data.length > 0) {
        setSelectedIdeaForView(data.data[0]);
      }

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

Browse through the ideas in the left panel, click to view details, and click "Generate Scores" when you want to evaluate an idea. You can also ask me to refine specific concepts or generate more alternatives.`,
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
              // Process each idea from the assistant's response
              const processedIdeas = data.data.ideas.map((updatedIdea: BusinessIdea) => {
                const existingIdea = ideas.find((i) => i.id === updatedIdea.id);

                // If this is an update to an existing idea
                if (existingIdea) {
                  // If updated idea has no metrics but existing one does, preserve existing metrics
                  if (!updatedIdea.metrics && existingIdea.metrics) {
                    return {
                      ...updatedIdea,
                      metrics: existingIdea.metrics,
                      evaluation: existingIdea.evaluation,
                      financialPreview: undefined,
                    };
                  }
                  // Preserve financialPreview flag
                  return {
                    ...updatedIdea,
                    financialPreview: undefined,
                  };
                }

                // This is a new idea - just return it as-is
                return {
                  ...updatedIdea,
                  financialPreview: undefined,
                };
              });

              // Trust the assistant's response completely - use the returned list
              // This allows for:
              // - Adding new ideas (assistant returns more ideas)
              // - Replacing/removing ideas (assistant returns fewer ideas)
              // - Updating ideas (assistant returns modified versions)

              // Track if the currently viewed idea is being replaced
              if (selectedIdeaForView) {
                const currentIdeaStillExists = processedIdeas.some((i: BusinessIdea) => i.id === selectedIdeaForView.id);
                if (!currentIdeaStillExists) {
                  // The currently viewed idea was replaced - find the replacement
                  // Look for ideas that are new (not in the original ideas list)
                  const originalIdeaIds = new Set(ideas.map(i => i.id));
                  const newIdeas = processedIdeas.filter((i: BusinessIdea) => !originalIdeaIds.has(i.id));

                  // If there's exactly one new idea, that's likely the replacement
                  // If there are multiple new ideas, pick the first one
                  if (newIdeas.length > 0) {
                    setReplacementIdeaId(newIdeas[0].id);
                  }
                }
              }

              setIdeas(processedIdeas);
              saveIdeas(processedIdeas);
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
        {/* Detail Mode - LinkedIn-style Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Sidebar - Compact Idea List */}
          <div className="flex-shrink-0 border-r bg-muted/5 flex flex-col w-full lg:w-[380px]">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h1 className="text-sm font-semibold">Your Ideas</h1>
                <Badge variant="secondary" className="text-xs">{ideas.length}</Badge>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {ideas.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 px-3">
                    <Lightbulb className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-xs text-muted-foreground text-center">No ideas yet. Click "Generate Ideas" to start.</p>
                  </CardContent>
                </Card>
              ) : (
                ideas.map((idea) => {
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
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-blue-300"
                      )}
                      onClick={() => handleViewIdea(idea.id)}
                    >
                      {/* Selection Indicator */}
                      {selectedIdeaForView?.id === idea.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                      )}

                      {/* Card Content */}
                      <div className="p-4">
                        <h3 className={cn(
                          "text-sm font-bold leading-tight mb-1.5",
                          selectedIdeaForView?.id === idea.id ? "text-purple-900 dark:text-purple-100" : "text-neutral-900 dark:text-neutral-100"
                        )}>
                          {idea.name}
                        </h3>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                          {idea.tagline}
                        </p>

                        {/* Short Summary */}
                        {idea.description && (
                          <p className="text-[10px] text-neutral-700 dark:text-neutral-300 line-clamp-3 leading-relaxed mb-3">
                            {idea.description}
                          </p>
                        )}

                        {/* Strategic Focus Areas */}
                        {idea.searchFields && (idea.searchFields.industries?.length || idea.searchFields.technologies?.length) && (
                          <div className="mb-3 space-y-1.5">
                            {idea.searchFields.industries && idea.searchFields.industries.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {idea.searchFields.industries.slice(0, 3).map((industry, idx) => (
                                  <span
                                    key={`ind-${idx}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  >
                                    {industry}
                                  </span>
                                ))}
                              </div>
                            )}
                            {idea.searchFields.technologies && idea.searchFields.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {idea.searchFields.technologies.slice(0, 3).map((tech, idx) => (
                                  <span
                                    key={`tech-${idx}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick Metrics */}
                        {idea.metrics && (
                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
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
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                            <Check className="h-3 w-3" />
                            Selected
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Detailed View */}
          {selectedIdeaForView && (
            <div className="flex-1 bg-background flex flex-col">
              <div className="flex-1 overflow-hidden">
                <IdeaDetailView
                  idea={selectedIdeaForView}
                  marketAnalysis={marketAnalysis}
                  allIdeas={ideas}
                  onSelect={handleConfirmIdeaSelection}
                  onGenerateScores={handleGenerateScores}
                  isScoring={!isScoringAll && scoringIdeaId === selectedIdeaForView.id}
                  isScoringAll={isScoringAll}
                  selectedIdeaId={selectedIdeaId}
                  hasUnscoredIdeas={ideas.some(i => !i.metrics)}
                />
              </div>
            </div>
          )}
        </div>

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
