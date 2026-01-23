import type {
  InnovationSession,
  WizardStep,
  ChatMessage,
  CrackItMessage,
  Challenge,
  MarketAnalysis,
  BusinessIdea,
  PitchDeck,
  IdeaMetrics,
  DetailedIdeaMetrics,
} from "@/types/innovation";

const SESSION_KEY = "innovation-session";

/**
 * Migrate legacy IdeaMetrics to DetailedIdeaMetrics
 * This provides backward compatibility for existing sessions
 */
export function migrateLegacyMetrics(legacyMetrics: IdeaMetrics): DetailedIdeaMetrics {
  // Map legacy metrics to new criteria
  // Legacy: marketFit, feasibility, innovation
  // New: problemClarity (35%), marketSize (10%), innovation (10%), financialViability (15%), strategicFit (5%), marketFit (25%)

  const problemClarity = Math.round((legacyMetrics.marketFit * 0.4 + legacyMetrics.feasibility * 0.3 + legacyMetrics.innovation * 0.3));
  const marketSize = Math.round((legacyMetrics.marketFit * 0.6 + legacyMetrics.feasibility * 0.4));
  const innovation = legacyMetrics.innovation;
  const financialViability = Math.round((legacyMetrics.feasibility * 0.7 + legacyMetrics.marketFit * 0.3));
  const strategicFit = Math.round((legacyMetrics.innovation * 0.5 + 50)); // Default moderate score
  const marketFit = legacyMetrics.marketFit;

  // Calculate weighted overall score
  const overallScore = Math.round(
    problemClarity * 0.35 +
    marketSize * 0.10 +
    innovation * 0.10 +
    financialViability * 0.15 +
    strategicFit * 0.05 +
    marketFit * 0.25
  );

  // Map legacy ROI to risk
  const riskMap = { high: "low", medium: "medium", low: "high" } as const;

  return {
    problemClarity: {
      score: problemClarity,
      weight: 0.35,
      feedback: "Migrated from legacy evaluation. Consider reviewing for accuracy.",
    },
    marketSize: {
      score: marketSize,
      weight: 0.10,
      feedback: "Migrated from legacy evaluation. Consider reviewing for accuracy.",
    },
    innovation: {
      score: innovation,
      weight: 0.10,
      feedback: "Migrated from legacy evaluation. Consider reviewing for accuracy.",
    },
    financialViability: {
      score: financialViability,
      weight: 0.15,
      feedback: "Migrated from legacy evaluation. Consider reviewing for accuracy.",
    },
    strategicFit: {
      score: strategicFit,
      weight: 0.05,
      feedback: "Migrated from legacy evaluation. Consider reviewing for accuracy.",
    },
    marketFit: {
      score: marketFit,
      weight: 0.25,
      feedback: "Migrated from legacy evaluation. Consider reviewing for accuracy.",
    },
    overallScore,
    roi: legacyMetrics.roi,
    risk: riskMap[legacyMetrics.roi] || "medium",
  };
}

/**
 * Check if an idea has legacy metrics format
 */
function hasLegacyMetrics(idea: BusinessIdea): boolean {
  // If no metrics, it's not legacy (it's a new idea from ideate phase)
  if (!idea.metrics) return false;
  // Legacy format has marketFit/feasibility but no overallScore
  return !("overallScore" in idea.metrics) && "marketFit" in idea.metrics && "feasibility" in idea.metrics;
}

/**
 * Migrate ideas with legacy metrics to new format
 */
function migrateIdeas(ideas: BusinessIdea[]): BusinessIdea[] {
  return ideas.map((idea) => {
    if (hasLegacyMetrics(idea)) {
      return {
        ...idea,
        metrics: migrateLegacyMetrics(idea.metrics as IdeaMetrics),
      };
    }
    return idea;
  });
}

/**
 * Initialize a new session
 */
export function createInitialSession(): InnovationSession {
  return {
    currentStep: "challenge",
    conversationHistory: [],
    ideationPhases: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Get session from storage
 * Automatically migrates legacy metrics to new format
 */
export function getSession(): InnovationSession | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as InnovationSession;

    // Migrate ideas with legacy metrics
    if (session.ideas && session.ideas.length > 0) {
      const needsMigration = session.ideas.some(hasLegacyMetrics);
      if (needsMigration) {
        session.ideas = migrateIdeas(session.ideas);
        // Save migrated session back to storage
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, updatedAt: Date.now() }));
      }
    }

    return session;
  } catch (error) {
    console.error("Error reading session:", error);
    return null;
  }
}

/**
 * Save session to storage
 */
export function saveSession(session: InnovationSession): void {
  if (typeof window === "undefined") return;

  try {
    const updated = { ...session, updatedAt: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

/**
 * Update session with partial changes
 */
export function updateSession(
  updates: Partial<InnovationSession>
): InnovationSession {
  const current = getSession() || createInitialSession();
  const updated = { ...current, ...updates, updatedAt: Date.now() };

  saveSession(updated);
  return updated;
}

/**
 * Clear session (start over)
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Reset current phase (clear phase data and conversation history)
 * Keeps other phases' data intact
 */
export function resetPhase(
  phase: "challenge" | "market" | "ideation" | "investment-appraisal" | "pitch"
): InnovationSession {
  if (typeof window === "undefined") {
    const session = getSession() || createInitialSession();
    return session;
  }

  const currentSession = getSession();
  if (!currentSession) {
    return createInitialSession();
  }

  // Create a copy of the session without the phase-specific data
  const updatedSession = { ...currentSession };

  // Clear phase-specific data by deleting the properties
  switch (phase) {
    case "challenge":
      delete (updatedSession as any).challenge;
      delete (updatedSession as any).challengeProgress;
      break;
    case "market":
      delete (updatedSession as any).marketAnalysis;
      break;
    case "ideation":
      delete (updatedSession as any).ideas;
      delete (updatedSession as any).generatedIdeas;
      delete (updatedSession as any).selectedIdeaId;
      break;
    case "investment-appraisal":
      delete (updatedSession as any).investmentAppraisal;
      delete (updatedSession as any).investmentProgress;
      break;
    case "pitch":
      delete (updatedSession as any).pitchDeck;
      break;
  }

  // Clear conversation history for this phase
  const historyField = `${phase}ConversationHistory` as keyof InnovationSession;
  delete (updatedSession as any)[historyField];

  // Update current step to this phase
  updatedSession.currentStep = phase;
  updatedSession.updatedAt = Date.now();

  // Save the updated session
  saveSession(updatedSession);

  return updatedSession;
}

/**
 * Update current wizard step
 */
export function setStep(step: WizardStep): InnovationSession {
  return updateSession({ currentStep: step });
}

/**
 * Save challenge data
 */
export function saveChallenge(challenge: Challenge): InnovationSession {
  return updateSession({
    challenge,
    currentStep: "market",
  });
}

/**
 * Save market analysis
 */
export function saveMarketAnalysis(market: MarketAnalysis): InnovationSession {
  return updateSession({
    marketAnalysis: market,
  });
}

/**
 * Save market analysis and advance to next step
 */
export function saveMarketAnalysisAndContinue(market: MarketAnalysis): InnovationSession {
  return updateSession({
    marketAnalysis: market,
    currentStep: "ideation",
  });
}

/**
 * Save investment appraisal data
 */
export function saveInvestmentAppraisal(appraisal: any): InnovationSession {
  return updateSession({
    investmentAppraisal: appraisal,
  });
}

/**
 * Save investment progress tracking
 * Note: Icons are not saved (React components can't be serialized)
 * They are restored from defaults when loading
 */
export function saveInvestmentProgress(progress: Array<{ id: string; label: string; status: string; excerpt?: string; isOptional?: boolean }>): InnovationSession {
  // Strip out icon property before saving (can't serialize React components)
  const progressWithoutIcons = progress.map(({ id, label, status, excerpt, isOptional }) => ({
    id,
    label,
    status,
    excerpt,
    isOptional,
  }));
  return updateSession({
    investmentProgress: progressWithoutIcons,
  });
}

/**
 * Get investment progress from session
 */
export function getInvestmentProgress(): Array<{ id: string; label: string; status: string; excerpt?: string; isOptional?: boolean }> | null {
  const session = getSession();
  return session?.investmentProgress || null;
}

/**
 * Save challenge progress tracking
 * Note: Icons are not saved (React components can't be serialized)
 * They are restored from defaults when loading
 */
export function saveChallengeProgress(progress: Array<{ id: string; label: string; status: string; excerpt?: string; isOptional?: boolean }>): InnovationSession {
  // Strip out icon property before saving (can't serialize React components)
  const progressWithoutIcons = progress.map(({ id, label, status, excerpt, isOptional }) => ({
    id,
    label,
    status,
    excerpt,
    isOptional,
  }));
  return updateSession({
    challengeProgress: progressWithoutIcons,
  });
}

/**
 * Get challenge progress from session
 */
export function getChallengeProgress(): Array<{ id: string; label: string; status: string; excerpt?: string; isOptional?: boolean }> | null {
  const session = getSession();
  return session?.challengeProgress || null;
}

/**
 * Save generated ideas (stays on ideation step)
 */
export function saveIdeas(ideas: BusinessIdea[]): InnovationSession {
  return updateSession({
    ideas,
    // currentStep remains "ideation" - no longer advances
  });
}

/**
 * Select an idea (stays on ideation step, for review sub-step)
 */
export function selectIdea(ideaId: string): InnovationSession {
  return updateSession({
    selectedIdeaId: ideaId,
    // currentStep remains "ideation" - moves to review sub-step internally
  });
}

/**
 * Add chat message to conversation history (deprecated - use phase-specific versions)
 */
export function addChatMessage(message: ChatMessage): InnovationSession {
  const current = getSession() || createInitialSession();
  const updatedHistory = [...current.conversationHistory, message];

  return updateSession({
    conversationHistory: updatedHistory,
  });
}

/**
 * Save conversation history for a specific phase
 */
export function saveConversationHistory(
  phase: "challenge" | "market" | "ideation" | "investment-appraisal" | "pitch",
  messages: ChatMessage[]
): InnovationSession {
  const historyField = `${phase}ConversationHistory` as keyof InnovationSession;
  return updateSession({
    [historyField]: messages,
  } as Partial<InnovationSession>);
}

/**
 * Get conversation history for a specific phase
 */
export function getConversationHistory(
  phase: "challenge" | "market" | "ideation" | "investment-appraisal" | "pitch"
): ChatMessage[] {
  const session = getSession();
  if (!session) return [];

  const historyField = `${phase}ConversationHistory` as keyof InnovationSession;
  return (session[historyField] as ChatMessage[]) || [];
}

/**
 * Save pitch deck
 */
export function savePitchDeck(pitch: PitchDeck): InnovationSession {
  return updateSession({
    pitchDeck: pitch,
    currentStep: "pitch",
  });
}

/**
 * Get current step index
 */
export function getStepIndex(currentStep: WizardStep): number {
  const steps = ["challenge", "market", "ideation", "pitch"];
  return steps.indexOf(currentStep);
}

/**
 * Check if a step is completed
 */
export function isStepComplete(step: WizardStep): boolean {
  const session = getSession();
  if (!session) return false;

  const currentIndex = getStepIndex(session.currentStep);
  const stepIndex = getStepIndex(step);

  return stepIndex < currentIndex;
}

/**
 * Check if a step is accessible
 */
export function isStepAccessible(step: WizardStep): boolean {
  const session = getSession();
  if (!session) return step === "challenge";

  const currentIndex = getStepIndex(session.currentStep);
  const stepIndex = getStepIndex(step);

  return stepIndex <= currentIndex;
}

/**
 * Navigate to a step
 */
export function navigateToStep(step: WizardStep): InnovationSession {
  if (isStepAccessible(step)) {
    return setStep(step);
  }

  // If trying to go forward, ensure prerequisites are met
  const session = getSession();
  if (!session) return setStep(step);

  // Validate prerequisites
  if (step === "market" && !session.challenge) {
    return session;
  }
  if (step === "ideation" && !session.marketAnalysis) {
    return session;
  }
  if (step === "pitch" && !session.selectedIdeaId) {
    return session;
  }

  return setStep(step);
}

/**
 * Save current session state to a JSON file
 * Downloads a file containing the complete session state
 */
export function saveStateToFile(): void {
  if (typeof window === "undefined") return;

  const session = getSession();
  if (!session) {
    alert("No session data to save.");
    return;
  }

  // Create a JSON string of the session
  const jsonString = JSON.stringify(session, null, 2);

  // Create a blob and download link
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `innovation-kit-state-${new Date().toISOString().slice(0, 10)}.json`;

  // Trigger download and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Load session state from a JSON file
 * Restores the complete session state from a file
 */
export function loadStateFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cannot load state in server environment"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const session = JSON.parse(jsonString) as InnovationSession;

        // Validate the session has basic required structure
        if (!session.currentStep) {
          throw new Error("Invalid session file: missing currentStep");
        }

        // Save the loaded session to sessionStorage
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

        // Reload the page to apply the loaded state
        window.location.reload();
        resolve();
      } catch (error) {
        alert("Failed to load session: Invalid file format");
        reject(error);
      }
    };

    reader.onerror = () => {
      alert("Failed to read file");
      reject(new Error("FileReader error"));
    };

    reader.readAsText(file);
  });
}

/**
 * Get Crack It conversation history
 */
export function getCrackItConversationHistory(): CrackItMessage[] {
  const session = getSession();
  if (!session) return [];
  return session.crackItConversationHistory || [];
}

/**
 * Save Crack It conversation history
 */
export function saveCrackItConversationHistory(messages: CrackItMessage[]): InnovationSession {
  return updateSession({
    crackItConversationHistory: messages,
  } as Partial<InnovationSession>);
}

/**
 * Add a message to Crack It conversation history
 */
export function addCrackItMessage(message: CrackItMessage): InnovationSession {
  const current = getCrackItConversationHistory();
  const updated = [...current, message];
  return saveCrackItConversationHistory(updated);
}

/**
 * Clear Crack It conversation history
 */
export function clearCrackItConversationHistory(): InnovationSession {
  return updateSession({
    crackItConversationHistory: [],
  } as Partial<InnovationSession>);
}

