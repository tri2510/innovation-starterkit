"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProgressTracker, ProgressItem } from "@/components/wizard/progress-tracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight, Lightbulb, Check, Loader2, Send } from "lucide-react";
import { saveChallenge, getSession, clearSession, updateSession, saveChallengeProgress, getChallengeProgress } from "@/lib/session";
import type { Challenge, ChatMessage } from "@/types/innovation";
import { DEMO_CHALLENGE } from "@/lib/demo-data";
import { WelcomeTooltip } from "@/components/tutorial/welcome-tooltip";
import { InteractiveTour } from "@/components/tutorial/interactive-tour";
import { streamChatResponse, ProgressUpdateChunk } from "@/hooks/use-chat-streaming";
import { PhaseLayout } from "@/components/wizard";
import { PhaseChat } from "@/components/chat";
import { usePhaseState } from "@/hooks";
import type { UsePhaseStateOptions } from "@/hooks";
import { useCaseStudy } from "@/contexts/case-study-context";

interface Message extends ChatMessage {
  isQuestion?: boolean;
}

/**
 * Challenge Phase Page
 *
 * First phase of the innovation wizard where users define their challenge.
 * Uses shared PhaseLayout and usePhaseState for consistent architecture,
 * while preserving custom ProgressTracker and onboarding tour functionality.
 */
export default function ChallengePage() {
  const router = useRouter();
  const { isActive: isCaseStudyActive } = useCaseStudy();

  // Required fields for the challenge
  const requiredFields = ["problem", "targetAudience", "currentSolutions"];

  // Local state for challenge-specific features
  const [questionCount, setQuestionCount] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | undefined>(undefined);
  const [challengeSummary, setChallengeSummary] = useState<Challenge | null>(null);

  // Progress tracking state
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([
    { id: "problem", label: "Problem Statement", icon: null as any, status: "pending", isOptional: false },
    { id: "targetAudience", label: "Target Audience", icon: null as any, status: "pending", isOptional: false },
    { id: "currentSolutions", label: "Existing Solutions", icon: null as any, status: "pending", isOptional: false },
    { id: "industry", label: "Industry", icon: null as any, status: "pending", isOptional: true },
    { id: "context", label: "Additional Context", icon: null as any, status: "pending", isOptional: true },
  ]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Use shared phase state hook
  const {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    setIsLoading,
    lastUserMessage,
    setLastUserMessage,
    inputRef,
    saveHistory,
    handleQuickFill,
  } = usePhaseState<Message>({
    phase: "challenge",
    prerequisites: {},
    demoData: DEMO_CHALLENGE,
    onDemoFill: (setPhaseData, addMessage) => {
      // Update progress items
      const updatedProgress: ProgressItem[] = [
        { id: "problem", label: "Problem Statement", icon: null as any, status: "complete", excerpt: DEMO_CHALLENGE.problem, isOptional: false },
        { id: "targetAudience", label: "Target Audience", icon: null as any, status: "complete", excerpt: DEMO_CHALLENGE.targetAudience, isOptional: false },
        { id: "currentSolutions", label: "Existing Solutions", icon: null as any, status: "complete", excerpt: DEMO_CHALLENGE.currentSolutions, isOptional: false },
        { id: "industry", label: "Industry", icon: null as any, status: DEMO_CHALLENGE.industry ? "complete" : "pending", excerpt: DEMO_CHALLENGE.industry || "", isOptional: true },
        { id: "context", label: "Additional Context", icon: null as any, status: DEMO_CHALLENGE.context ? "complete" : "pending", excerpt: DEMO_CHALLENGE.context || "", isOptional: true },
      ];
      setProgressItems(updatedProgress);
      setOverallProgress(calculateProgress(updatedProgress));
      setChallengeSummary(DEMO_CHALLENGE);
      setPhaseData(DEMO_CHALLENGE);

      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "✓ Demo data loaded! All challenge fields have been filled with sample data. Click 'Analyze Market' to continue.",
        timestamp: Date.now(),
      });
    },
    getGreetingMessage: () => ({
      id: "greeting",
      role: "assistant",
      content: "Welcome! I'm here to help you define your innovation challenge. Let's start by understanding what problem you're trying to solve. What challenge or opportunity are you exploring?",
      timestamp: Date.now(),
      isQuestion: true,
    }),
    loadConversationHistory: true, // Enable auto-save/load for conversation history
  });

  // Filter out empty assistant messages
  const visibleMessages = useMemo(() => {
    return messages.filter((m) => {
      if (m.role === "user") return true;
      return m.content && m.content.trim().length > 0;
    });
  }, [messages]);

  // Track if we've initialized the session
  const hasInitializedSession = useRef(false);

  // Initialize session and check existing data
  useEffect(() => {
    // Skip if already initialized
    if (hasInitializedSession.current) {
      return;
    }

    const session = getSession();

    // First, try to load from challengeProgress (exact state restoration)
    const savedProgress = getChallengeProgress();
    if (savedProgress && savedProgress.length > 0 && !isCaseStudyActive) {
      // Restore the exact state with icons added back
      const restoredProgress: ProgressItem[] = savedProgress.map(item => ({
        ...item,
        icon: null as any,
        status: item.status as "pending" | "gathering" | "awaiting_confirmation" | "complete",
      }));
      setProgressItems(restoredProgress);
      setOverallProgress(calculateProgress(restoredProgress));

      // Also restore challengeSummary from the progress data
      if (restoredProgress.some(p => p.excerpt)) {
        setChallengeSummary({
          problem: restoredProgress.find(i => i.id === "problem")?.excerpt || "",
          targetAudience: restoredProgress.find(i => i.id === "targetAudience")?.excerpt || "",
          currentSolutions: restoredProgress.find(i => i.id === "currentSolutions")?.excerpt || "",
          industry: restoredProgress.find(i => i.id === "industry")?.excerpt || "",
          context: restoredProgress.find(i => i.id === "context")?.excerpt || "",
        });
      }
    }
    // Backward compatibility: fall back to loading from challenge data
    else if (session?.challenge && !isCaseStudyActive) {
      setChallengeSummary(session.challenge);

      // Load progress items from challenge (backward compatibility)
      const updatedProgress: ProgressItem[] = [
        { id: "problem", label: "Problem Statement", icon: null as any, status: "complete", excerpt: session.challenge.problem, isOptional: false },
        { id: "targetAudience", label: "Target Audience", icon: null as any, status: "complete", excerpt: session.challenge.targetAudience, isOptional: false },
        { id: "currentSolutions", label: "Existing Solutions", icon: null as any, status: "complete", excerpt: session.challenge.currentSolutions, isOptional: false },
        { id: "industry", label: "Industry", icon: null as any, status: session.challenge.industry ? "complete" : "pending", excerpt: session.challenge.industry || "", isOptional: true },
        { id: "context", label: "Additional Context", icon: null as any, status: session.challenge.context ? "complete" : "pending", excerpt: session.challenge.context || "", isOptional: true },
      ];
      setProgressItems(updatedProgress);
      setOverallProgress(calculateProgress(updatedProgress));
    } else if (!isCaseStudyActive) {
      // No session data - ensure progress items are reset to initial state
      const resetProgress: ProgressItem[] = [
        { id: "problem", label: "Problem Statement", icon: null as any, status: "pending", excerpt: "", isOptional: false },
        { id: "targetAudience", label: "Target Audience", icon: null as any, status: "pending", excerpt: "", isOptional: false },
        { id: "currentSolutions", label: "Existing Solutions", icon: null as any, status: "pending", excerpt: "", isOptional: false },
        { id: "industry", label: "Industry", icon: null as any, status: "pending", excerpt: "", isOptional: true },
        { id: "context", label: "Additional Context", icon: null as any, status: "pending", excerpt: "", isOptional: true },
      ];
      setProgressItems(resetProgress);
      setOverallProgress(0);
      setChallengeSummary(null);
    }

    hasInitializedSession.current = true;
  }, [isCaseStudyActive]);

  // Load case study data when in case study mode
  useEffect(() => {
    if (isCaseStudyActive) {
      const session = getSession();
      if (session?.challenge) {
        setChallengeSummary(session.challenge);

        // Mark all progress items as complete for case study
        const updatedProgress: ProgressItem[] = [
          { id: "problem", label: "Problem Statement", icon: null as any, status: "complete", excerpt: session.challenge.problem, isOptional: false },
          { id: "targetAudience", label: "Target Audience", icon: null as any, status: "complete", excerpt: session.challenge.targetAudience, isOptional: false },
          { id: "currentSolutions", label: "Existing Solutions", icon: null as any, status: "complete", excerpt: session.challenge.currentSolutions, isOptional: false },
          { id: "industry", label: "Industry", icon: null as any, status: session.challenge.industry ? "complete" : "pending", excerpt: session.challenge.industry || "", isOptional: true },
          { id: "context", label: "Additional Context", icon: null as any, status: "complete", excerpt: session.challenge.context || "", isOptional: true },
        ];
        setProgressItems(updatedProgress);
        setOverallProgress(100);

        // Load case study conversation messages
        if (session.challengeConversationHistory) {
          setMessages(session.challengeConversationHistory);
        }
      }
    }
  }, [isCaseStudyActive, setMessages]);

  // Check if user has seen the tour
  useEffect(() => {
    if (isCaseStudyActive) {
      setTourCompleted(true);
      setShowTour(false);
      return;
    }

    if ((process.env.NEXT_PUBLIC_DISABLE_TOUR as string | undefined) === 'true') {
      setTourCompleted(true);
      return;
    }

    const hasSeenTour = localStorage.getItem("innovation-kit-interactive-tour-completed");
    if (!hasSeenTour) {
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    } else {
      setTourCompleted(true);
    }
  }, [isCaseStudyActive]);

  // Auto-save conversation history whenever messages change
  useEffect(() => {
    if (messages.length > 0 && !isCaseStudyActive) {
      saveHistory();
    }
  }, [messages, saveHistory, isCaseStudyActive]);

  // Update question count based on messages
  useEffect(() => {
    const count = messages.filter((m) => m.role === "assistant").length;
    setQuestionCount(count);
  }, [messages]);

  // Auto-save progress items to session whenever they change
  useEffect(() => {
    if (!isCaseStudyActive) {
      saveChallengeProgress(progressItems);
    }
  }, [progressItems, isCaseStudyActive]);

  // Client-side fallback: Auto-show Analyze Market button when all required fields are complete
  useEffect(() => {
    if (areRequiredFieldsComplete(progressItems) && !challengeSummary && !isCaseStudyActive) {
      const summary: Challenge = {
        problem: progressItems.find(i => i.id === "problem")?.excerpt || "",
        targetAudience: progressItems.find(i => i.id === "targetAudience")?.excerpt || "",
        currentSolutions: progressItems.find(i => i.id === "currentSolutions")?.excerpt || "",
        industry: progressItems.find(i => i.id === "industry")?.excerpt || "",
        context: progressItems.find(i => i.id === "context")?.excerpt || "",
      };
      setChallengeSummary(summary);
    }
  }, [progressItems, challengeSummary, isCaseStudyActive]);

  // Helper functions
  const calculateProgress = (items: ProgressItem[]) => {
    let score = 0;
    let maxScore = 0;
    items.forEach(item => {
      const weight = item.isOptional ? 0.5 : 1;
      maxScore += weight * 100;
      if (item.status === "complete") score += weight * 100;
      else if (item.status === "awaiting_confirmation") score += weight * 75;
      else if (item.status === "gathering") score += weight * 50;
    });
    return Math.round((score / maxScore) * 100);
  };

  const areRequiredFieldsComplete = (items: ProgressItem[]) => {
    return requiredFields.every(fieldId => {
      const item = items.find(i => i.id === fieldId);
      return item?.status === "complete";
    });
  };

  const getCelebrationMessage = (fieldId: string): string | null => {
    const messages: Record<string, string> = {
      problem: "Great! I understand your problem. Now let's identify who you're helping.",
      targetAudience: "Perfect! Got your target audience. Next, let's explore current solutions.",
      currentSolutions: "Excellent! I have a clear picture of the solution landscape.",
    };
    return messages[fieldId] || null;
  };

  // Retry handler
  const handleRetry = () => {
    if (lastUserMessage.trim() && !isLoading) {
      handleSendMessage(lastUserMessage);
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    // In case study mode, don't send messages
    if (isCaseStudyActive) {
      return;
    }

    const contentToSend = messageContent || inputValue;
    if (!contentToSend.trim() || isLoading) return;

    setLastUserMessage(contentToSend);

    const userMessage: Message = {
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
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isQuestion: true,
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      await streamChatResponse("/api/ai/challenge",
        {
          userInput: contentToSend,
          conversationHistory: messages.map(({ role, content }) => ({ role, content })),
        },
        {
          filterDisplayContent: (content) => {
            let filtered = content.replace(/```json\s*[\s\S]*?```/g, '');
            filtered = filtered.replace(/```\s*[\s\S]*?```/g, '');
            filtered = filtered.replace(/\{[\s\S]*?"message"[\s\S]*?"progress_update"[\s\S]*?\}/g, '');
            return filtered.trim();
          },

          onChunk: (chunk, displayContent, fullResponse, data) => {
            if (data.type === 'structured' && data.data?.message) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: data.data.message } : m
                )
              );
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: displayContent } : m
                )
              );
            }
          },

          onProgressUpdate: (update) => {
            const isMarketUpdate = 'section' in update.data;
            let field: string | undefined;
            let status: string;
            let excerpt: string;

            if (isMarketUpdate) {
              const marketData = update.data as { section: string; status: string; excerpt: string };
              field = undefined;
              status = marketData.status;
              excerpt = marketData.excerpt;
            } else {
              const challengeData = update.data as { field: string; status: string; excerpt: string };
              field = challengeData.field;
              status = challengeData.status;
              excerpt = challengeData.excerpt;
            }

            if (field && status === "gathering") {
              setActiveQuestionId(field);
            }

            setProgressItems((prev) => {
              const updated = prev.map((item) => {
                if (field && item.id === field) {
                  const wasGathering = item.status === "gathering";
                  if (wasGathering && status === "complete" && !item.isOptional) {
                    const message = getCelebrationMessage(item.id);
                    if (message) {
                      setCelebrationMessage(message);
                      setTimeout(() => setCelebrationMessage(null), 3000);
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

              setOverallProgress(calculateProgress(updated));
              return updated;
            });
          },

          onComplete: (data) => {
            if (data.type === 'summary') {
              const summary = data.data;
              const updatedProgress: ProgressItem[] = [
                { id: "problem", label: "Problem Statement", icon: null as any, status: "complete", excerpt: summary.problem, isOptional: false },
                { id: "targetAudience", label: "Target Audience", icon: null as any, status: "complete", excerpt: summary.targetAudience, isOptional: false },
                { id: "currentSolutions", label: "Existing Solutions", icon: null as any, status: "complete", excerpt: summary.currentSolutions, isOptional: false },
                { id: "industry", label: "Industry", icon: null as any, status: summary.industry ? "complete" : "pending", excerpt: summary.industry || "", isOptional: true },
                { id: "context", label: "Additional Context", icon: null as any, status: summary.context ? "complete" : "pending", excerpt: summary.context || "", isOptional: true },
              ];

              setProgressItems(updatedProgress);
              setOverallProgress(calculateProgress(updatedProgress));
              setChallengeSummary(summary);
              setActiveQuestionId(undefined);

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId
                    ? { ...m, content: "✓ I've gathered all the information about your innovation challenge. You can review what was captured in the progress tracker, then click 'Analyze Market' to continue.", isQuestion: false }
                    : m
                )
              );
            } else {
              setQuestionCount((prev) => prev + 1);
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
          msg.id === aiMessageId ? { ...msg, content: "Sorry, I encountered an error. Please try again." } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (isCaseStudyActive) {
      // In case study mode, just navigate - no save needed
      router.push("/market");
      return;
    }

    const challenge: Challenge = {
      problem: progressItems.find(i => i.id === "problem")?.excerpt || "",
      targetAudience: progressItems.find(i => i.id === "targetAudience")?.excerpt || "",
      currentSolutions: progressItems.find(i => i.id === "currentSolutions")?.excerpt || "",
      industry: progressItems.find(i => i.id === "industry")?.excerpt || "",
      context: progressItems.find(i => i.id === "context")?.excerpt || "",
    };

    const summaryToSave = challengeSummary || challenge;
    saveChallenge(summaryToSave);
    router.push("/market");
  };

  const handleEditField = (itemId: string) => {
    if (isCaseStudyActive) return;

    const editPrompts: Record<string, string> = {
      problem: "I'd like to add more details about the problem statement",
      targetAudience: "I'd like to provide more information about the target audience",
      currentSolutions: "I'd like to add more details about current solutions",
      industry: "I'd like to specify the industry",
      context: "I'd like to add more context about my solution idea",
    };

    setInputValue(editPrompts[itemId] || `I'd like to update the ${itemId.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}.`);

    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  };

  const handleConfirmChip = async (itemId: string, confirmed: boolean) => {
    if (isCaseStudyActive) return;

    if (confirmed) {
      setProgressItems((prev) => {
        const updated = prev.map((item) => {
          if (item.id === itemId) {
            return { ...item, status: "complete" as const };
          }
          return item;
        });
        setOverallProgress(calculateProgress(updated));
        return updated;
      });

      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `Yes, that's correct for ${progressItems.find(i => i.id === itemId)?.label || itemId}.`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, confirmMessage]);
      setInputValue("");
      setIsLoading(true);

      const aiMessageId = "ai-" + Date.now();
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isQuestion: false,
      };
      setMessages((prev) => [...prev, aiMessage]);

      try {
        await streamChatResponse("/api/ai/challenge",
          {
            userInput: `Yes, that's correct for ${progressItems.find(i => i.id === itemId)?.label || itemId}.`,
            conversationHistory: messages.map(({ role, content }) => ({ role, content })),
          },
          {
            filterDisplayContent: (content) => {
              let filtered = content.replace(/```json\s*[\s\S]*?```/g, '');
              filtered = filtered.replace(/```\s*[\s\S]*?```/g, '');
              filtered = filtered.replace(/\{[\s\S]*?"message"[\s\S]*?"progress_update"[\s\S]*?\}/g, '');
              return filtered.trim();
            },

            onChunk: (chunk, displayContent, fullResponse, data) => {
              if (data.type === 'structured' && data.data?.message) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, content: data.data.message } : m
                  )
                );
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, content: displayContent } : m
                  )
                );
              }
            },

            onProgressUpdate: (update) => {
              const isMarketUpdate = 'section' in update.data;
              let field: string | undefined;
              let status: string;
              let excerpt: string;

              if (isMarketUpdate) {
                const marketData = update.data as { section: string; status: string; excerpt: string };
                field = undefined;
                status = marketData.status;
                excerpt = marketData.excerpt;
              } else {
                const challengeData = update.data as { field: string; status: string; excerpt: string };
                field = challengeData.field;
                status = challengeData.status;
                excerpt = challengeData.excerpt;
              }

              if (field && status === "gathering") {
                setActiveQuestionId(field);
              }

              setProgressItems((prev) => {
                const updated = prev.map((item) => {
                  if (field && item.id === field) {
                    return {
                      ...item,
                      status: status as "gathering" | "awaiting_confirmation" | "complete",
                      excerpt: (excerpt || item.excerpt) || "",
                    };
                  }
                  return item;
                });
                setOverallProgress(calculateProgress(updated));
                return updated;
              });
            },

            onComplete: (data) => {
              if (data.type === 'summary') {
                const summary = data.data;
                const updatedProgress: ProgressItem[] = [
                  { id: "problem", label: "Problem Statement", icon: null as any, status: "complete", excerpt: summary.problem, isOptional: false },
                  { id: "targetAudience", label: "Target Audience", icon: null as any, status: "complete", excerpt: summary.targetAudience, isOptional: false },
                  { id: "currentSolutions", label: "Existing Solutions", icon: null as any, status: "complete", excerpt: summary.currentSolutions, isOptional: false },
                  { id: "industry", label: "Industry", icon: null as any, status: summary.industry ? "complete" : "pending", excerpt: summary.industry || "", isOptional: true },
                  { id: "context", label: "Additional Context", icon: null as any, status: summary.context ? "complete" : "pending", excerpt: summary.context || "", isOptional: true },
                ];

                setProgressItems(updatedProgress);
                setOverallProgress(calculateProgress(updatedProgress));
                setActiveQuestionId(undefined);

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, content: "Excellent! I've developed a comprehensive understanding of your innovation challenge. The consultation is complete - you can review the captured insights in the progress tracker, then click 'Analyze Market' to continue.", isQuestion: false }
                      : m
                  )
                );
              } else {
                setQuestionCount((prev) => prev + 1);
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
        console.error("Error sending confirmation:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, content: "Sorry, I encountered an error. Please try again." } : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      setProgressItems((prev) => {
        const updated = prev.map((item) => {
          if (item.id === itemId) {
            return { ...item, status: "pending" as const, excerpt: "" };
          }
          return item;
        });
        setOverallProgress(calculateProgress(updated));
        return updated;
      });

      const skipMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: "No, let's skip that for now.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, skipMessage]);
    }
  };

  const handleConfirm = async (itemId: string) => {
    if (isCaseStudyActive) return;

    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Yes, that's exactly right. Please continue.",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, confirmMessage]);
    setInputValue("");
    setIsLoading(true);

    const aiMessageId = "ai-" + Date.now();
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isQuestion: false,
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      await streamChatResponse("/api/ai/challenge",
        {
          userInput: "Yes, that's exactly right. Please continue.",
          conversationHistory: messages.map(({ role, content }) => ({ role, content })),
        },
        {
          filterDisplayContent: (content) => {
            let filtered = content.replace(/```json\s*[\s\S]*?```/g, '');
            filtered = filtered.replace(/```\s*[\s\S]*?```/g, '');
            filtered = filtered.replace(/\{[\s\S]*?"message"[\s\S]*?"progress_update"[\s\S]*?\}/g, '');
            return filtered.trim();
          },

          onChunk: (chunk, displayContent, fullResponse, data) => {
            if (data.type === 'structured' && data.data?.message) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: data.data.message } : m
                )
              );
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: displayContent } : m
                )
              );
            }
          },

          onProgressUpdate: (update) => {
            const isMarketUpdate = 'section' in update.data;
            let field: string | undefined;
            let status: string;
            let excerpt: string;

            if (isMarketUpdate) {
              const marketData = update.data as { section: string; status: string; excerpt: string };
              field = undefined;
              status = marketData.status;
              excerpt = marketData.excerpt;
            } else {
              const challengeData = update.data as { field: string; status: string; excerpt: string };
              field = challengeData.field;
              status = challengeData.status;
              excerpt = challengeData.excerpt;
            }

            if (field && status === "gathering") {
              setActiveQuestionId(field);
            }

            setProgressItems((prev) => {
              const updated = prev.map((item) => {
                if (field && item.id === field) {
                  if (status === "complete") {
                    const message = getCelebrationMessage(item.id);
                    if (message) {
                      setCelebrationMessage(message);
                      setTimeout(() => setCelebrationMessage(null), 3000);
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
              setOverallProgress(calculateProgress(updated));
              return updated;
            });
          },

          onComplete: (data) => {
            if (data.type === 'summary') {
              const summary = data.data;
              const updatedProgress: ProgressItem[] = [
                { id: "problem", label: "Problem Statement", icon: null as any, status: "complete", excerpt: summary.problem, isOptional: false },
                { id: "targetAudience", label: "Target Audience", icon: null as any, status: "complete", excerpt: summary.targetAudience, isOptional: false },
                { id: "currentSolutions", label: "Existing Solutions", icon: null as any, status: "complete", excerpt: summary.currentSolutions, isOptional: false },
                { id: "industry", label: "Industry", icon: null as any, status: summary.industry ? "complete" : "pending", excerpt: summary.industry || "", isOptional: true },
                { id: "context", label: "Additional Context", icon: null as any, status: summary.context ? "complete" : "pending", excerpt: summary.context || "", isOptional: true },
              ];

              setProgressItems(updatedProgress);
              setOverallProgress(calculateProgress(updatedProgress));
              setActiveQuestionId(undefined);

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId
                    ? { ...m, content: "Excellent! I've developed a comprehensive understanding of your innovation challenge. The consultation is complete - you can review the captured insights in the progress tracker, then click 'Analyze Market' to continue.", isQuestion: false }
                    : m
                )
              );
            } else {
              setQuestionCount((prev) => prev + 1);
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
      console.error("Error sending confirmation:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId ? { ...msg, content: "Sorry, I encountered an error. Please try again." } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    setTourCompleted(true);
  };

  const handleShowTour = () => {
    setShowTour(true);
  };

  // Sample prompts (only in non-case-study mode)
  const allSamplePrompts = [
    "I want to improve remote team collaboration",
    "Small businesses struggle with inventory management",
    "People waste too much time finding healthy recipes",
    "Finding reliable home service providers is frustrating",
    "Schools need better ways to track student attendance",
    "Gyms struggle with member retention and engagement",
    "Parents have a hard time finding trustworthy babysitters",
    "Event planners need tools to manage vendor relationships",
  ];

  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>([]);

  useEffect(() => {
    if (isCaseStudyActive) return;

    const shuffled = [...allSamplePrompts].sort(() => Math.random() - 0.5);
    setDisplayedPrompts(shuffled.slice(0, 3));
  }, [isCaseStudyActive]);

  const handleSuggestionClick = async (prompt: string) => {
    await handleSendMessage(prompt);
  };

  // Handle copying selected text to input
  const handleCopyToInput = (text: string) => {
    setInputValue(inputValue ? `${inputValue} ${text}` : text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Custom above-input content for confirmation chips
  const confirmationChips = !isLoading && !isCaseStudyActive && progressItems.filter(item => item.status === "awaiting_confirmation").length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {progressItems
        .filter(item => item.status === "awaiting_confirmation")
        .slice(0, 1)
        .map(item => (
          <div key={item.id} className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleConfirmChip(item.id, true)}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 h-8 px-3 text-xs font-medium"
            >
              <Check className="h-3 w-3 mr-1" />
              Yes, confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleConfirmChip(item.id, false)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 h-8 px-3 text-xs font-medium"
            >
              Let me clarify
            </Button>
          </div>
        ))}
    </div>
  ) : null;

  // Custom above-input content for suggestion chips - static
  const suggestionChips = !isLoading && !isCaseStudyActive ? (
    <div className="flex flex-wrap gap-2">
      {displayedPrompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => handleSuggestionClick(prompt)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          disabled={isLoading}
        >
          <span className="truncate max-w-[280px]">{prompt}</span>
        </button>
      ))}
    </div>
  ) : null;

  // Case study mode banner in chat
  const caseStudyBanner = isCaseStudyActive ? (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
      <p className="text-sm text-primary font-medium mb-1">📚 Case Study Mode</p>
      <p className="text-xs text-muted-foreground">You're viewing a real-world success story. Chat is disabled in case study mode. Use the navigation above to explore each phase.</p>
    </div>
  ) : null;

  // Combine custom chips
  const aboveInputContent = (confirmationChips || suggestionChips || caseStudyBanner) ? (
    <>
      {caseStudyBanner}
      {confirmationChips}
      {suggestionChips}
    </>
  ) : undefined;

  return (
    <>
      {showTour && !isCaseStudyActive && <InteractiveTour onComplete={handleTourComplete} />}
      {!showTour && tourCompleted && !isCaseStudyActive && <WelcomeTooltip />}

      <PhaseLayout
        currentStep="challenge"
        leftPanelWidth={420}
        leftPanel={
          <PhaseChat
            title="Conversation"
            subtitle={isCaseStudyActive ? "Case Study Walkthrough" : `${questionCount} ${questionCount === 1 ? 'question' : 'questions'}`}
            messages={visibleMessages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSendMessage={() => handleSendMessage()}
            isLoading={isLoading}
            onRetry={handleRetry}
            onCopyToInput={handleCopyToInput}
            aboveInputContent={aboveInputContent}
            placeholder={isCaseStudyActive ? "Chat disabled in case study mode" : "Type your response... (Enter to send)"}
            disabled={isCaseStudyActive}
          />
        }
        rightPanel={
          <>
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h1 className="text-sm font-semibold">
                  {isCaseStudyActive ? "Case Study Progress" : "Your Progress"}
                </h1>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
              <ProgressTracker
                items={progressItems}
                overallProgress={overallProgress}
                onEdit={handleEditField}
                onConfirm={handleConfirm}
                activeQuestionId={activeQuestionId}
                isReviewMode={!!challengeSummary}
                currentQuestionNumber={questionCount}
                totalExpectedQuestions={3}
                celebrationMessage={celebrationMessage}
                onContinue={undefined}
              />
            </div>

            {challengeSummary && (
              <div className="flex-shrink-0 border-t bg-background/95 px-4 py-3 flex justify-end">
                <Button
                  onClick={handleContinue}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCaseStudyActive ? "Next Phase: Market" : "Analyze Market"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        }
        headerProps={{
          showRestart: !isCaseStudyActive,
          onShowTour: !isCaseStudyActive ? handleShowTour : undefined,
        }}
        navProps={undefined}
      />
    </>
  );
}
