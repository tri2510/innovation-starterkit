// Wizard Steps
export type WizardStep = "challenge" | "market" | "ideation" | "investment-appraisal" | "pitch";

export interface WizardStepInfo {
  id: WizardStep;
  title: string;
  description: string;
  path: string;
}

export const WIZARD_STEPS: WizardStepInfo[] = [
  { id: "challenge", title: "Challenge", description: "Your challenge", path: "/challenge" },
  { id: "market", title: "Market", description: "Analyze market", path: "/market" },
  { id: "ideation", title: "Ideate", description: "Generate, select & refine", path: "/ideation" },
  { id: "investment-appraisal", title: "Appraisal", description: "Financial analysis & ROI", path: "/investment-appraisal" },
  { id: "pitch", title: "Pitch", description: "Create pitch deck", path: "/pitch" },
];

// Ideation sub-steps (internal navigation within ideation page)
export type IdeationSubStep = "generate" | "select" | "review";

export const IDEATION_SUB_STEPS: IdeationSubStep[] = ["generate", "select", "review"];

// Search field types for strategic mapping
export type Industry = "manufacturing" | "healthcare" | "automotive" | "agriculture";
export type Technology = "ai-edge" | "sdv" | "robotics" | "virtualization" | "cloud";

export interface SearchFieldAssignment {
  industries: Industry[];
  technologies: Technology[];
  reasoning: string; // AI explanation for field assignments
}

// Challenge Definition
export interface Challenge {
  problem: string;
  targetAudience: string;
  currentSolutions: string;
  industry?: string; // Legacy text field (kept for backward compatibility)
  context?: string;
  strategicFocus?: SearchFieldAssignment; // User-selected strategic focus areas
}

// Market Analysis
export interface MarketAnalysis {
  tam: string;
  sam: string;
  som: string;
  trends: MarketTrend[];
  competitors: Competitor[];
  opportunities: string[];
  challenges: string[];
}

export interface MarketTrend {
  name: string;
  description: string;
  momentum: "rising" | "stable" | "declining";
  impact: "high" | "medium" | "low";
}

export interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  marketShare?: string;
}

// Business Idea
// Fields generated in ideate phase: id, name, tagline, description, problemSolved, searchFields, brief, metrics, evaluation
// Fields generated in appraisal phase: targetMarket, businessModel, revenueStreams, competitiveAdvantage, estimatedInvestment, timeframe, financialPreview
export interface BusinessIdea {
  id: string;
  name: string  ;
  tagline: string;
  description: string;
  problemSolved: string;
  searchFields?: SearchFieldAssignment; // AI-assigned search fields (generated in ideate phase)
  brief?: string; // Detailed reasoning brief explaining the idea's concept, differentiation, implementation, and positioning
  metrics?: IdeaMetrics; // Quick metrics (uniqueness, feasibility, etc.) - generated in ideate phase via separate evaluation call
  evaluation?: IdeaEvaluation; // Critical evaluation with strengths, weaknesses, assumptions, questions - generated in ideate phase via separate evaluation call
  // Fields generated in appraisal phase (optional until appraisal is complete)
  targetMarket?: string;
  businessModel?: string;
  revenueStreams?: string[];
  competitiveAdvantage?: string;
  estimatedInvestment?: string;
  timeframe?: string;
  financialPreview?: QuickFinancialPreview; // Cached financial projections - generated in appraisal phase
  detailedMetrics?: DetailedIdeaMetrics; // Detailed metrics with ScoreCriterion - used in detailed view only
}

export interface IdeaMetrics {
  marketFit: number; // 0-100
  feasibility: number; // 0-100
  innovation: number; // 0-100
  uniqueness: number; // 0-100 - How unique/different this idea is from others
  roi: "high" | "medium" | "low";
  risk: "high" | "medium" | "low";
}

// Critical evaluation from the skeptical investor evaluator
export interface IdeaEvaluation {
  strengths: string[]; // What's genuinely good about this idea
  weaknesses: string[]; // What could cause failure
  assumptions: string[]; // What are they assuming without proof
  criticalQuestions: string[]; // What would a skeptical investor ask
}

// New 6-criteria scoring system with weighted evaluation
export interface ScoreCriterion {
  score: number; // 0-100
  weight: number; // Decimal weight (e.g., 0.35 for 35%)
  feedback: string; // AI-generated explanation
}

export interface DetailedIdeaMetrics {
  // Individual criteria scores with feedback
  problemClarity: ScoreCriterion; // 35% - Clarity of problem & value of problem
  marketSize: ScoreCriterion; // 10% - Size of targeted market
  innovation: ScoreCriterion; // 10% - Innovation level (market creation or improvement)
  financialViability: ScoreCriterion; // 15% - Financial viability
  strategicFit: ScoreCriterion; // 5% - Strategic search field mapping
  marketFit: ScoreCriterion; // 25% - Market fit ranking

  // Computed overall score (weighted average)
  overallScore: number; // 0-100

  // Legacy compatibility (computed from new criteria)
  roi: "high" | "medium" | "low";
  risk: "high" | "medium" | "low";

  // Additional metrics from ideation phase
  feasibility?: number; // 0-100
  uniqueness?: number; // 0-100
}

// Chat Messages for Ideation
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Crack It Messages (includes thinking and web search sources)
export interface CrackItMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  searchQuery?: string;
  searchKeywords?: string; // Search keywords/terms used
  sources?: Array<{
    refer: string;
    title: string;
    link: string;
    media: string;
    content: string;
    icon: string;
    publish_date: string;
  }>;
  timestamp: number;
  // UI streaming state (not persisted, only used during active streaming)
  isSearching?: boolean;
  isStreaming?: boolean;
  streamPhase?: "thinking" | "content" | "done";
  statusMessage?: string; // Current status message to display
  statusStage?: "starting" | "searching" | "analyzing" | "done";
}

export interface IdeationPhase {
  id: string;
  name: string;
  status: "pending" | "active" | "completed";
  messages: ChatMessage[];
}

// Pitch Deck
export interface PitchDeck {
  title: string;
  tagline: string;
  slides: PitchSlide[];
}

export type SlideType =
  | "title"
  | "problem"
  | "solution"
  | "market"
  | "business-model"
  | "competition"
  | "traction"
  | "team"
  | "ask";

export interface PitchSlide {
  id: string;
  type: SlideType;
  title: string;
  content: Record<string, string | string[]>;
}

// Session State
export interface InnovationSession {
  currentStep: WizardStep;
  challenge?: Challenge;
  marketAnalysis?: MarketAnalysis;
  ideas?: BusinessIdea[];
  selectedIdeaId?: string;
  // Main conversation history (used for Define/Challenge phase)
  conversationHistory: ChatMessage[];
  // Phase-specific conversation histories for seamless persistence
  challengeConversationHistory?: ChatMessage[];
  marketConversationHistory?: ChatMessage[];
  ideationConversationHistory?: ChatMessage[];
  investmentAppraisalConversationHistory?: ChatMessage[];
  // Note: ideas and review phases are now merged into ideation
  pitchConversationHistory?: ChatMessage[];
  // Crack It conversation history (global across all phases)
  crackItConversationHistory?: CrackItMessage[];
  ideationPhases: IdeationPhase[];
  investmentAppraisal?: any; // Investment appraisal data
  investmentProgress?: Array<{ id: string; label: string; status: string; excerpt?: string; isOptional?: boolean }>; // Investment progress tracking
  challengeProgress?: Array<{ id: string; label: string; status: string; excerpt?: string; isOptional?: boolean }>; // Challenge progress tracking
  pitchDeck?: PitchDeck;
  startedAt: number;
  updatedAt: number;
}

// API Request/Response Types
export interface AIRequest {
  session: InnovationSession;
  input?: string;
  context?: Record<string, unknown>;
}

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  session?: InnovationSession;
}

// Inline Edit Types
export interface EditableField {
  path: string; // e.g., "market.tam", "ideas.0.description"
  value: string;
  isEditing: boolean;
}

export interface RefineRequest {
  session: InnovationSession;
  fieldPath: string;
  newValue: string;
  context?: string;
}

// Quick Financial Preview - Simplified projections shown in ideation phase
export interface QuickFinancialPreview {
  fiveYearCumulativeROI: number; // Percentage (e.g., 151)
  breakEvenYear: number; // Year when EBIT turns positive (1-5)
  totalInvestment: string; // Formatted string (e.g., "$2.5M")
  year5Revenue: string; // Formatted string (e.g., "$10M")
  gate1Status: "met" | "not-met"; // Break-even ≤ 3 years
  gate2Status: "met" | "not-met"; // ROI ≥ 150%
  assumptions?: string; // Brief explanation of projections

  // Radar chart scores (0-100)
  radarScores: RadarScores;
}

// Radar chart scores for innovation comparison
export interface RadarScores {
  marketFit: number; // Market fit and potential
  innovation: number; // Innovation level and uniqueness
  financialViability: number; // Financial strength and ROI potential
  strategicFit: number; // Alignment with strategic focus
  riskLevel: number; // Risk-adjusted viability (higher = better)
  marketSize: number; // Market size and growth potential
}

// Innovation database benchmark data by industry
export interface IndustryBenchmark {
  industry: Industry;
  averageScores: RadarScores;
  sampleSize: number;
  lastUpdated: string;
}

// Case Studies Types
export type CaseStudyPhaseType = "challenge" | "market" | "ideation" | "investment-appraisal" | "pitch";
export type BusinessModelType = "marketplace" | "saas" | "on-demand" | "subscription" | "freemium" | "e-commerce";

export interface CaseStudyChallenge {
  problem: string;
  targetAudience: string;
  currentSolutions: string;
  keyInsight: string;
}

export interface CaseStudyMarket {
  marketSize: string;
  targetSegment: string;
  initialTargetMarket: string;
  trends: string[];
  competitors: string[];
  opportunities: string[];
  keyInsight: string;
}

export interface CaseStudyIdeation {
  initialIdea: string;
  pivots: string[];
  finalValueProp: string;
  keyFeatures: string[];
  mvpFeatures: string[];
  uniqueSellingPoints: string[];
  keyInsight: string;
}

export interface CaseStudyInvestment {
  fundingNeeded: string;
  useOfFunds: Array<{ category: string; amount: string; description: string }>;
  revenueModel: string;
  projections?: {
    year1?: { revenue: string; users?: string; rides?: string; bookings?: string; cities?: string; subscribers?: string };
    year2?: { revenue: string; users?: string; rides?: string; bookings?: string; cities?: string; subscribers?: string };
    year3?: { revenue: string; users?: string; rides?: string; bookings?: string; cities?: string; subscribers?: string };
  };
  initialInvestment: string;
  fundingRounds: Array<{ round: string; amount: string; investors: string[]; date: string }>;
  breakEvenTimeframe: string;
  roi: string;
  keyInsight: string;
}

export interface CaseStudyPitch {
  title: string;
  tagline: string;
  traction: string;
  team: string;
  ask: string;
  keySlides: string[];
  keyInsight: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  tagline: string;
  company: string;
  yearFounded: number;
  industry: string;
  businessModel: BusinessModelType;
  featured: boolean;
  tags: string[];

  // Full walkthrough data for each phase
  phases: {
    challenge: CaseStudyChallenge;
    market: CaseStudyMarket;
    ideation: CaseStudyIdeation;
    "investment-appraisal": CaseStudyInvestment;
    pitch: CaseStudyPitch;
  };

  // Overall metrics
  metrics: {
    roi: string;
    timeframe: string;
    marketImpact: string;
  };

  // Key learnings
  keyLearnings: string[];
}
