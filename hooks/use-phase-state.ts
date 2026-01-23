"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage, Challenge, MarketAnalysis, BusinessIdea, PitchDeck } from "@/types/innovation";
import {
  getSession,
  getConversationHistory,
  saveConversationHistory,
} from "@/lib/session";

/**
 * Phase type for the wizard
 */
export type PhaseType = "challenge" | "market" | "ideation" | "investment-appraisal" | "pitch";

/**
 * Phase prerequisites - what data is required before entering a phase
 */
export interface PhasePrerequisites {
  challenge?: boolean;
  marketAnalysis?: boolean;
  selectedIdea?: boolean;
  selectedIdeaId?: boolean;
  ideas?: boolean;
}

/**
 * Options for usePhaseState hook
 */
export interface UsePhaseStateOptions<T = any> {
  /** The current phase */
  phase: PhaseType;
  /** Prerequisites that must be met before entering this phase */
  prerequisites?: PhasePrerequisites;
  /** Initial phase data state */
  initialData?: T | null;
  /** Demo data for quick fill (Ctrl+Shift+D) */
  demoData?: any;
  /** Callback when demo mode is triggered */
  onDemoFill?: (setPhaseData: (data: any) => void, addMessage: (msg: ChatMessage) => void) => void;
  /** Custom greeting message generator */
  getGreetingMessage?: (session: any, phaseData: T | null) => ChatMessage;
  /** Whether to auto-load conversation history */
  loadConversationHistory?: boolean;
}

/**
 * Session data types
 */
export interface SessionData {
  challenge?: Challenge;
  marketAnalysis?: MarketAnalysis;
  ideas?: BusinessIdea[];
  selectedIdeaId?: string;
  pitchDeck?: PitchDeck;
}

/**
 * Return type for usePhaseState hook
 */
export interface UsePhaseStateReturn<T = any> {
  // Session data
  session: any;
  sessionData: SessionData;
  isInitialLoad: boolean;

  // Phase data state
  phaseData: T | null;
  setPhaseData: (data: T | null) => void;

  // Chat state
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  lastUserMessage: string;
  setLastUserMessage: (message: string) => void;

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;

  // Actions
  addMessage: (message: ChatMessage) => void;
  saveHistory: () => void;
  handleQuickFill: () => void;
}

/**
 * Custom hook for unified phase state management
 *
 * Provides:
 * - Session data loading and validation
 * - Prerequisite checking with automatic redirect
 * - Chat state (messages, input, loading)
 * - Phase-specific data state
 * - Demo mode hotkey (Ctrl+Shift+D)
 * - Conversation history persistence
 * - Auto-scroll to bottom of chat
 *
 * @example
 * ```tsx
 * const {
 *   sessionData,
 *   phaseData,
 *   messages,
 *   inputValue,
 *   setInputValue,
 *   isLoading,
 *   addMessage,
 *   saveHistory,
 * } = usePhaseState({
 *   phase: "ideation",
 *   prerequisites: { challenge: true, marketAnalysis: true },
 *   getGreetingMessage: (session) => ({ ... }),
 * });
 * ```
 */
export function usePhaseState<T = any>(options: UsePhaseStateOptions<T>): UsePhaseStateReturn<T> {
  const {
    phase,
    prerequisites = {},
    initialData = null,
    demoData,
    onDemoFill,
    getGreetingMessage,
    loadConversationHistory = true,
  } = options;

  const router = useRouter();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session state
  const [session, setSession] = useState<any>(null);
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Phase data state
  const [phaseData, setPhaseDataState] = useState<T | null>(initialData);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Wrapper for setPhaseData that works with both values and updater functions
  const setPhaseData = useCallback((data: T | null | ((prev: T | null) => T | null)) => {
    setPhaseDataState((prev) => {
      const newData = typeof data === "function" ? (data as (prev: T | null) => T | null)(prev) : data;
      return newData;
    });
  }, []);

  // Add a message to the chat
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Save conversation history
  const saveHistory = useCallback(() => {
    if (loadConversationHistory && messages.length > 0) {
      saveConversationHistory(phase as any, messages);
    }
  }, [phase, messages, loadConversationHistory]);

  // Ref to track if we've already loaded the session
  const hasLoadedSession = useRef(false);

  // Load session and validate prerequisites
  useEffect(() => {
    // Skip if we've already loaded
    if (hasLoadedSession.current) {
      return;
    }

    const loadSession = () => {
      const currentSession = getSession();

      if (!currentSession) {
        // For challenge phase specifically, create a new session and show greeting
        if (phase === "challenge") {
          // Create initial session for challenge phase
          const { createInitialSession, saveSession } = require("@/lib/session");
          const newSession = createInitialSession();
          saveSession(newSession);

          setSession(newSession);
          setSessionData({});

          // Set greeting message for fresh start
          if (loadConversationHistory && getGreetingMessage) {
            const greeting = getGreetingMessage(null, null);
            setMessages([greeting]);
          }

          setIsInitialLoad(false);
          hasLoadedSession.current = true;
          return;
        }

        router.push("/challenge");
        return;
      }

      // Validate prerequisites
      if (prerequisites.challenge && !currentSession.challenge) {
        router.push("/challenge");
        return;
      }
      if (prerequisites.marketAnalysis && !currentSession.marketAnalysis) {
        router.push("/market");
        return;
      }
      if (prerequisites.selectedIdea && !currentSession.selectedIdeaId) {
        router.push("/ideation");
        return;
      }

      setSession(currentSession);
      setSessionData({
        challenge: currentSession.challenge,
        marketAnalysis: currentSession.marketAnalysis,
        ideas: currentSession.ideas,
        selectedIdeaId: currentSession.selectedIdeaId,
        pitchDeck: (currentSession as any).pitchDeck,
      });

      // Load phase data from session based on phase type
      if (phase === "market" && currentSession.marketAnalysis) {
        setPhaseDataState(currentSession.marketAnalysis as T);
      } else if (phase === "investment-appraisal" && (currentSession as any).investmentAppraisal) {
        setPhaseDataState((currentSession as any).investmentAppraisal as T);
      } else if (phase === "pitch" && (currentSession as any).pitchDeck) {
        setPhaseDataState((currentSession as any).pitchDeck as T);
      }

      // Load conversation history
      if (loadConversationHistory) {
        const history = getConversationHistory(phase as any);
        if (history.length > 0) {
          setMessages(history);
        } else if (getGreetingMessage) {
          const greeting = getGreetingMessage(currentSession, null);
          setMessages([greeting]);
        }
      }

      setIsInitialLoad(false);
      hasLoadedSession.current = true;
    };

    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]); // Only re-run if phase changes

  // Demo mode hotkey (Ctrl+Shift+D)
  useEffect(() => {
    if (!demoData && !onDemoFill) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        handleQuickFill();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [demoData, onDemoFill]);

  // Handle quick fill (demo mode)
  const handleQuickFill = useCallback(() => {
    if (onDemoFill) {
      onDemoFill(setPhaseData, addMessage);
    } else if (demoData) {
      setPhaseData(demoData);
      const demoMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "✓ Demo data loaded successfully.",
        timestamp: Date.now(),
      };
      addMessage(demoMessage);
    }
  }, [demoData, onDemoFill, setPhaseData, addMessage]);

  return {
    // Session data
    session,
    sessionData,
    isInitialLoad,

    // Phase data state
    phaseData,
    setPhaseData,

    // Chat state
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    setIsLoading,
    lastUserMessage,
    setLastUserMessage,

    // Refs
    messagesEndRef,
    chatContainerRef,
    inputRef,

    // Actions
    addMessage,
    saveHistory,
    handleQuickFill,
  };
}
