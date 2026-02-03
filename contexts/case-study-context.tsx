"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CaseStudy, Challenge, MarketAnalysis, BusinessIdea, ChatMessage, InnovationSession } from "@/types/innovation";
import { getSession, saveSession, saveChallenge, saveMarketAnalysis } from "@/lib/session";

const CASE_STUDY_MODE_KEY = "caseStudyMode";
const CASE_STUDY_DATA_KEY = "caseStudyData";
const SAVED_SESSION_KEY = "savedSessionBeforeCaseStudy";

interface CaseStudyContextValue {
  isActive: boolean;
  caseStudy: CaseStudy | null;
  enterCaseStudyMode: (study: CaseStudy, startPhase?: string) => void;
  exitCaseStudyMode: () => void;
}

const CaseStudyContext = createContext<CaseStudyContextValue | undefined>(undefined);

export function CaseStudyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [savedSession, setSavedSession] = useState<InnovationSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Convert case study data to session data for each phase
  const convertCaseStudyToSession = useCallback((study: CaseStudy): Partial<InnovationSession> => {
    // Convert challenge phase
    const challenge: Challenge = {
      problem: study.phases.challenge.problem || "",
      targetAudience: study.phases.challenge.targetAudience || "",
      currentSolutions: study.phases.challenge.currentSolutions || "",
      industry: study.industry || "",
      context: `Case Study: ${study.company} (${study.yearFounded})`,
    };

    // Convert market phase with full detailed content
    const marketAnalysis: MarketAnalysis = {
      tam: study.phases.market.marketSize || "",
      sam: study.phases.market.targetSegment || "",
      som: study.phases.market.initialTargetMarket || "",
      trends: (study.phases.market.trends || []).map(t => ({
        name: t,
        description: `Growing trend in ${study.industry} industry`,
        momentum: "rising" as const,
        impact: "high" as const,
      })),
      competitors: (study.phases.market.competitors || []).map((c) => ({
        name: c || "",
        strengths: ["Established brand", "Large customer base", "Significant resources"],
        weaknesses: ["Legacy technology", "Slow innovation", "Poor user experience"],
        marketShare: undefined,
      })),
      opportunities: study.phases.market.opportunities || [],
      challenges: [
        "Regulatory uncertainty in the market",
        "High customer acquisition costs",
        "Need for rapid scaling",
      ],
    };

    // Create comprehensive business idea from ideation phase
    const businessIdea: BusinessIdea = {
      id: `case-study-${study.id}`,
      name: study.title || "",
      tagline: study.tagline || "",
      description: study.phases.ideation.finalValueProp || "",
      problemSolved: study.phases.challenge.problem || "",
      brief: study.phases.ideation.finalValueProp || "",
      metrics: {
        marketFit: 95,
        feasibility: 90,
        innovation: 88,
        uniqueness: 85,
        roi: "high" as const,
        risk: "low" as const,
      },
    };

    // Investment appraisal data
    const investmentAppraisal = {
      fundingRequired: study.phases["investment-appraisal"].fundingNeeded || "$1M",
      useOfFunds: (study.phases["investment-appraisal"].useOfFunds || []).map(u => ({
        category: u.category,
        amount: u.amount,
        description: u.description,
      })),
      financialProjections: {
        year1: { revenue: study.phases["investment-appraisal"].projections?.year1?.revenue || "$500K", users: "10,000" },
        year2: { revenue: study.phases["investment-appraisal"].projections?.year2?.revenue || "$2M", users: "50,000" },
        year3: { revenue: study.phases["investment-appraisal"].projections?.year3?.revenue || "$5M", users: "200,000" },
      },
      fundingRounds: (study.phases["investment-appraisal"].fundingRounds || []).map(r => ({
        round: r.round,
        amount: r.amount,
        investors: r.investors,
        date: r.date,
      })),
      keyMetrics: {
        cac: "$50",
        ltv: "$500",
        paybackPeriod: "4 months",
        grossMargin: "75%",
        burnRate: "$100K/month",
      },
    };

    // Pitch data
    const pitchData = {
      title: study.title,
      tagline: study.tagline,
      problem: study.phases.challenge.problem,
      solution: study.phases.ideation.finalValueProp,
      marketSize: study.phases.market.marketSize,
      businessModel: study.phases["investment-appraisal"].revenueModel,
      traction: study.phases.pitch.traction || "",
      team: study.phases.pitch.team || "",
      ask: study.phases.pitch.ask || "",
    };

    // Generate comprehensive chat messages for each phase
    const challengeConversationHistory: ChatMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: `Welcome! This is the innovation journey of **${study.company}** - a case study from ${study.yearFounded}. Let me walk you through how they defined their challenge, analyzed the market, generated their idea, and built a successful business.`,
        timestamp: Date.now() - 150000,
      },
      {
        id: "2",
        role: "assistant",
        content: `## 🎯 Challenge Definition

**Problem:** ${study.phases.challenge.problem || ""}

**Target Audience:** ${study.phases.challenge.targetAudience || ""}

**Existing Solutions:** ${study.phases.challenge.currentSolutions || ""}

**Key Insight:** ${study.phases.challenge.keyInsight || ""}

I've captured the challenge. The key insight here was that the existing solutions were missing something fundamental - let's explore the market to understand the opportunity better.`,
        timestamp: Date.now() - 140000,
      },
    ];

    const marketConversationHistory: ChatMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: `## 📊 Market Analysis

**Total Addressable Market (TAM):** ${study.phases.market.marketSize || ""}

**Serviceable Addressable Market (SAM):** ${study.phases.market.targetSegment || ""}

**Serviceable Obtainable Market (SOM):** ${study.phases.market.initialTargetMarket || ""}

**Market Trends:**
${(study.phases.market.trends || []).map(t => `- ${t}`).join("\n")}

**Competitors:**
${(study.phases.market.competitors || []).map(c => `- ${c}`).join("\n")}

**Key Opportunities:**
${(study.phases.market.opportunities || []).map(o => `- ${o}`).join("\n")}

The market analysis revealed significant whitespace. Now let's generate some innovative ideas to capitalize on this opportunity.`,
        timestamp: Date.now() - 130000,
      },
    ];

    const ideationConversationHistory: ChatMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: `## 💡 Ideation Phase

**Final Value Proposition:** ${study.phases.ideation.finalValueProp || ""}

**Key Features:**
${(study.phases.ideation.keyFeatures || []).map(f => `- **${f}** - Core differentiator`).join("\n")}

**MVP Features:**
${(study.phases.ideation.mvpFeatures || []).map(f => `- ${f}`).join("\n")}

**Unique Selling Points:**
${(study.phases.ideation.uniqueSellingPoints || []).map(u => `- ${u}`).join("\n")}

I've generated a comprehensive business concept. Let's now evaluate the investment requirements and financial projections.`,
        timestamp: Date.now() - 120000,
      },
    ];

    const investmentConversationHistory: ChatMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: `## 💰 Investment Appraisal

**Funding Required:** ${study.phases["investment-appraisal"].fundingNeeded || ""}

**Use of Funds:**
${(study.phases["investment-appraisal"].useOfFunds || []).map(u => `- **${u.category}:** ${u.amount} - ${u.description}`).join("\n")}

**Revenue Model:** ${study.phases["investment-appraisal"].revenueModel || ""}

**Financial Projections:**
- Year 1: ${study.phases["investment-appraisal"].projections?.year1?.revenue || ""}
- Year 2: ${study.phases["investment-appraisal"].projections?.year2?.revenue || ""}
- Year 3: ${study.phases["investment-appraisal"].projections?.year3?.revenue || ""}

**Unit Economics:**
- Customer Acquisition Cost: $50
- Lifetime Value: $500
- Payback Period: 4 months

**Funding Rounds:**
${(study.phases["investment-appraisal"].fundingRounds || []).map(r => `- **${r.round}:** ${r.amount} from ${r.investors.join(", ")} (${r.date})`).join("\n")}

Strong financial model with clear path to profitability. Now let's prepare the pitch deck.`,
        timestamp: Date.now() - 110000,
      },
    ];

    const pitchConversationHistory: ChatMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: `## 🎤 Pitch Deck

**Title:** ${study.title}

**Tagline:** ${study.tagline}

**The Problem:**
${study.phases.challenge.problem}

**Our Solution:**
${study.phases.ideation.finalValueProp}

**Market Opportunity:**
${study.phases.market.marketSize}

**Business Model:**
${study.phases["investment-appraisal"].revenueModel}

**Traction:**
${study.phases.pitch.traction || "Strong initial traction with early adopters"}

**The Team:**
${study.phases.pitch.team || "Experienced founders with domain expertise"}

**The Ask:**
${study.phases.pitch.ask || "Seeking strategic partners and early adopters"}

This pitch structure effectively communicates the vision, opportunity, and execution plan. Ready to present to investors!`,
        timestamp: Date.now() - 100000,
      },
    ];

    const allMessages: ChatMessage[] = [
      ...challengeConversationHistory,
      ...marketConversationHistory,
      ...ideationConversationHistory,
      ...investmentConversationHistory,
      ...pitchConversationHistory,
    ];

    return {
      challenge,
      marketAnalysis,
      ideas: [businessIdea],
      selectedIdeaId: `case-study-${study.id}`,
      investmentAppraisal,
      conversationHistory: allMessages,
      challengeConversationHistory,
      marketConversationHistory,
      ideationConversationHistory,
      investmentAppraisalConversationHistory: investmentConversationHistory,
      pitchConversationHistory,
      currentStep: "challenge",
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  // Initialize from session storage on mount
  useEffect(() => {
    const storedMode = sessionStorage.getItem(CASE_STUDY_MODE_KEY);
    const storedData = sessionStorage.getItem(CASE_STUDY_DATA_KEY);

    if (storedMode === "active" && storedData) {
      try {
        const study = JSON.parse(storedData);
        setCaseStudy(study);
        setIsActive(true);

        // Populate the session with case study data
        const sessionData = convertCaseStudyToSession(study);
        saveSession(sessionData as InnovationSession);
      } catch (error) {
        console.error("Failed to parse case study data:", error);
        sessionStorage.removeItem(CASE_STUDY_MODE_KEY);
        sessionStorage.removeItem(CASE_STUDY_DATA_KEY);
      }
    }

    setIsInitialized(true);
  }, [convertCaseStudyToSession]);

  // Update session when case study changes
  useEffect(() => {
    if (!isInitialized || !isActive || !caseStudy) return;

    const sessionData = convertCaseStudyToSession(caseStudy);
    saveSession(sessionData as InnovationSession);
  }, [isActive, caseStudy, isInitialized, convertCaseStudyToSession]);

  const enterCaseStudyMode = useCallback((study: CaseStudy, startPhase?: string) => {
    // Save the current user's session
    const currentSession = getSession();
    sessionStorage.setItem(SAVED_SESSION_KEY, JSON.stringify(currentSession));
    setSavedSession(currentSession);

    // Set case study mode
    setCaseStudy(study);
    setIsActive(true);

    // Save to session storage for persistence
    sessionStorage.setItem(CASE_STUDY_MODE_KEY, "active");
    sessionStorage.setItem(CASE_STUDY_DATA_KEY, JSON.stringify(study));

    // Populate session with case study data
    const sessionData = convertCaseStudyToSession(study);
    saveSession(sessionData as InnovationSession);

    // Navigate to the start phase
    if (startPhase) {
      router.push(`/${startPhase}`);
    }
  }, [convertCaseStudyToSession, router]);

  const exitCaseStudyMode = useCallback(() => {
    // Restore the user's session
    const savedSessionData = sessionStorage.getItem(SAVED_SESSION_KEY);
    if (savedSessionData) {
      try {
        const restoredSession = JSON.parse(savedSessionData);
        saveSession(restoredSession);
      } catch (error) {
        console.error("Failed to restore session:", error);
      }
      sessionStorage.removeItem(SAVED_SESSION_KEY);
    }

    // Clear case study mode
    setCaseStudy(null);
    setIsActive(false);
    setSavedSession(null);

    // Clear storage
    sessionStorage.removeItem(CASE_STUDY_MODE_KEY);
    sessionStorage.removeItem(CASE_STUDY_DATA_KEY);

    // Navigate to challenge page
    router.push("/challenge");
  }, [router]);

  // Auto-exit case study mode if navigating to root or non-phase pages
  useEffect(() => {
    if (!isInitialized) return;

    const phaseRoutes = ["/challenge", "/market", "/ideation", "/investment-appraisal", "/pitch"];

    if (isActive && !phaseRoutes.some(route => pathname === route)) {
      exitCaseStudyMode();
    }
  }, [pathname, isActive, isInitialized, exitCaseStudyMode]);

  return (
    <CaseStudyContext.Provider
      value={{
        isActive,
        caseStudy,
        enterCaseStudyMode,
        exitCaseStudyMode,
      }}
    >
      {children}
    </CaseStudyContext.Provider>
  );
}

export function useCaseStudy() {
  const context = useContext(CaseStudyContext);
  if (!context) {
    throw new Error("useCaseStudy must be used within CaseStudyProvider");
  }
  return context;
}
