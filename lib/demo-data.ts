/**
 * DEMO DATA FOR QUICK FILL
 *
 * To disable demo mode, set NEXT_PUBLIC_DEMO_MODE=false in .env or .env.local
 * All Quick Fill buttons will be hidden when disabled.
 */

import type { Challenge, MarketAnalysis, BusinessIdea } from "@/types/innovation";

export const DEMO_CHALLENGE: Challenge = {
  problem: "Small businesses struggle to manage inventory efficiently, leading to stockouts and overstocking that costs them 30% of revenue annually.",
  targetAudience: "Small retail businesses (1-50 employees) in the fashion and electronics industries who need affordable inventory management.",
  currentSolutions: "Expensive enterprise ERP systems ($10K+) that are too complex for small teams, or manual spreadsheets that are error-prone and time-consuming.",
  industry: "Retail Technology",
  context: "Most small businesses can't afford dedicated inventory managers and rely on owners who juggle multiple responsibilities.",
};

export const DEMO_MARKET_ANALYSIS: MarketAnalysis = {
  tam: "$45B",
  sam: "$8.2B",
  som: "$420M",
  opportunities: [
    "73% of small businesses still use manual inventory methods",
    "Growing trend toward cloud-based solutions among SMBs",
    "Post-COVID shift to omnichannel retail creating complexity",
    "Mobile-first preferences among younger business owners",
  ],
  trends: [
    { name: "AI-powered demand forecasting", description: "Machine learning predicts stock needs", momentum: "rising", impact: "high" },
    { name: "Real-time inventory tracking", description: "IoT sensors provide live stock levels", momentum: "rising", impact: "high" },
    { name: "Mobile-first POS integration", description: "Seamless mobile point-of-sale systems", momentum: "stable", impact: "medium" },
    { name: "Sustainable inventory practices", description: "Eco-friendly inventory management", momentum: "rising", impact: "medium" },
  ],
  competitors: [
    { name: "QuickBooks Commerce", strengths: ["Brand recognition", "Accounting integration"], weaknesses: ["Expensive for small business", "Complex setup"], marketShare: "25%" },
    { name: "TradeGecko", strengths: ["Feature-rich", "Multi-channel support"], weaknesses: ["Complex onboarding", "Higher cost"], marketShare: "15%" },
    { name: "inFlow Inventory", strengths: ["Affordable", "Easy to use"], weaknesses: ["Limited integrations", "Basic reporting"], marketShare: "10%" },
  ],
  challenges: [
    "Building trust with small business owners who are skeptical of new technology",
    "Competing with free or low-cost spreadsheet alternatives",
    "Educating market about ROI of automated inventory management",
  ],
};

export const DEMO_IDEAS: BusinessIdea[] = [
  {
    id: "idea-1",
    name: "StockSmart AI",
    tagline: "AI-powered inventory management that thinks ahead",
    description: "An intelligent inventory management platform specifically designed for small retail businesses. Uses machine learning to predict stock needs, automate reordering, and prevent stockouts before they happen.",
    problemSolved: "Eliminates costly stockouts and overstocking through predictive analytics",
    searchFields: {
      industries: ["manufacturing"],
      technologies: ["ai-edge", "cloud"],
      reasoning: "Leverages edge AI for real-time inventory processing with cloud-based analytics. Highly relevant for manufacturing inventory management and retail operations.",
    },
  },
  {
    id: "idea-2",
    name: "InventoryFlow",
    tagline: "Simple inventory tracking that works with your existing tools",
    description: "A lightweight inventory management solution that integrates seamlessly with popular e-commerce platforms and POS systems. Focuses on automation and ease of use without the complexity of enterprise solutions.",
    problemSolved: "Reduces manual data entry and eliminates spreadsheet errors",
    searchFields: {
      industries: ["manufacturing"],
      technologies: ["cloud"],
      reasoning: "Cloud-native platform focused on e-commerce integrations. Most relevant for manufacturing and retail businesses with online sales channels.",
    },
  },
  {
    id: "idea-3",
    name: "RetailMind Cloud",
    tagline: "The all-in-one retail operations platform for growing businesses",
    description: "A comprehensive platform combining inventory management, sales analytics, customer insights, and supplier management in one affordable package. Designed for businesses ready to scale but not ready for enterprise pricing.",
    problemSolved: "Provides enterprise-level insights at small business prices",
    searchFields: {
      industries: ["manufacturing", "automotive"],
      technologies: ["cloud", "virtualization"],
      reasoning: "Cloud-based platform with virtualization support for multi-location operations. Relevant for manufacturing and automotive dealerships requiring inventory tracking across multiple sites.",
    },
  },
];

export const DEMO_APPRAISAL = {
  // BusinessIdea fields (moved from ideate phase)
  targetMarket: "Small retail businesses (1-50 employees) in fashion and electronics sectors experiencing inventory management challenges. Primary focus on boutique fashion retailers and consumer electronics stores who need affordable, intuitive inventory optimization without enterprise complexity.",
  businessModel: "B2B SaaS subscription with tiered pricing structure. Basic tier ($49/month) provides essential inventory tracking and alerts. Professional tier ($149/month) includes AI-powered demand forecasting and supplier integration. Enterprise tier ($499/month) offers multi-location management, custom integrations, and dedicated support. Revenue streams include monthly subscription fees, transaction fees on supplier orders (1.5%), and premium support packages ($99/month).",
  revenueStreams: [
    "Monthly subscription fees (tiered pricing)",
    "Transaction fees on supplier orders (1.5%)",
    "Premium support and onboarding services",
    "API access for third-party integrations",
  ],
  competitiveAdvantage: "AI-powered predictive inventory analytics with 95% accuracy, industry-first POS integration enabling real-time stock level visibility, affordable pricing targeting underserved micro-business segment, intuitive mobile-first design requiring minimal training, and automated supplier reordering capabilities. Unique value proposition combines enterprise-grade intelligence with small-business-friendly UX and pricing.",
  estimatedInvestment: "$500,000 - $750,000",
  timeframe: "18-24 months to reach product-market fit and positive cash flow",
  metrics: {
    // Legacy metrics
    // Detailed metrics (merged from legacy and detailed)
    overallScore: 82,
    problemClarity: { score: 88, weight: 0.35, feedback: "Problem is well-defined with quantifiable impact on small retail businesses. Stockouts and overstocking directly affect 30% of revenue, creating clear value proposition." },
    marketSize: { score: 75, weight: 0.10, feedback: "TAM is significant ($12B US retail inventory software market). SAM represents micro-retail segment ($2.4B). SOM is achievable with focused go-to-market strategy." },
    innovation: { score: 82, weight: 0.10, feedback: "Novel AI approach to demand forecasting in SMB segment. While inventory management exists, AI-powered predictive analytics at this price point is differentiated." },
    financialViability: { score: 80, weight: 0.15, feedback: "Strong unit economics with low CAC through freemium model. LTV:CAC ratio of 4.2:1 indicates sustainable business model. 18-month payback is reasonable for SaaS." },
    strategicFit: { score: 70, weight: 0.05, feedback: "Aligns with e-commerce enablement and digital transformation trends. Strong strategic fit with retail technology ecosystem." },
    marketFit: { score: 85, weight: 0.25, feedback: "Clear product-market fit opportunity. SMB retailers actively seeking affordable inventory solutions. Early customer validation shows strong willingness to pay." },
    // Legacy metrics for backward compatibility
    roi: "high",
    risk: "medium",
  },

  // Financial model fields (existing)
  personnelCosts: {
    team: [
      { role: "CEO/Founder", headcount: 1, annualSalary: "$120,000", equity: "5%" },
      { role: "CTO/Lead Developer", headcount: 1, annualSalary: "$140,000", equity: "3%" },
      { role: "Frontend Developer", headcount: 1, annualSalary: "$95,000", equity: "1%" },
      { role: "Backend Developer", headcount: 1, annualSalary: "$95,000", equity: "1%" },
      { role: "Product Manager", headcount: 1, annualSalary: "$110,000", equity: "1%" },
      { role: "Sales/Marketing Lead", headcount: 1, annualSalary: "$90,000", equity: "1%" },
    ],
    totalAnnual: "$650,000",
    totalWithBenefits: "$715,000",
  },
  operatingExpenses: {
    items: [
      { category: "Office/Co-working", monthly: "$4,000", annual: "$48,000" },
      { category: "Cloud Infrastructure (AWS/GCP)", monthly: "$3,500", annual: "$42,000" },
      { category: "Software Tools & Licenses", monthly: "$1,200", annual: "$14,400" },
      { category: "Marketing & Advertising", monthly: "$8,000", annual: "$96,000" },
      { category: "Legal & Accounting", monthly: "$2,000", annual: "$24,000" },
      { category: "Insurance", monthly: "$1,500", annual: "$18,000" },
    ],
    totalMonthly: "$20,200",
    totalAnnual: "$242,400",
  },
  capitalInvestments: {
    items: [
      { category: "Product Development", amount: "$250,000", description: "Initial MVP development" },
      { category: "Equipment & Hardware", amount: "$45,000", description: "Laptops, servers, test devices" },
      { category: "Initial Marketing Campaign", amount: "$75,000", description: "Launch marketing push" },
      { category: "Legal & IP Protection", amount: "$25,000", description: "Patents, trademarks" },
      { category: "Working Capital Reserve", amount: "$155,000", description: "12-month operating buffer" },
    ],
    totalInitial: "$550,000",
  },
  revenueForecasts: {
    year1: { projected: "$480,000", growth: "-", assumptions: "500 customers @ $80/month" },
    year2: { projected: "$1,440,000", growth: "200%", assumptions: "1,500 customers @ $80/month" },
    year3: { projected: "$3,360,000", growth: "133%", assumptions: "3,500 customers @ $80/month" },
    year4: { projected: "$6,240,000", growth: "86%", assumptions: "6,500 customers @ $80/month" },
    year5: { projected: "$9,600,000", growth: "54%", assumptions: "10,000 customers @ $80/month" },
  },
  financialAnalysis: {
    totalInvestment: "$1,250,000",
    fiveYearRevenue: "$21,120,000",
    fiveYearProfitAfterExpenses: "$7,860,000",
    roi: "628%",
    paybackPeriod: "18 months",
    npv: "$4,850,000",
    irr: "68%",
    breakEvenPoint: "Month 16",
  },
  riskAssessment: {
    riskLevel: "medium",
    viabilityScore: "78/100",
    keyRisks: [
      "Competition from established ERP vendors",
      "Customer acquisition cost higher than projected",
      "Technology platform reliability at scale",
    ],
    mitigations: [
      "Focus on underserved micro-business segment",
      "Freemium model to reduce CAC",
      "Incremental scaling with robust testing",
    ],
    recommendation: "Recommended with conditions. Strong market opportunity and solid unit economics. Secure initial funding for 18-month runway and focus on product-market fit validation before aggressive scaling.",
  },
  completedSections: ["targetMarket", "businessModel", "competitiveAdvantage", "investmentCosts", "revenueForecasts", "financialMetrics", "riskAssessment"],
};

// Helper to get demo mode status from environment
export const isDemoMode = (): boolean => {
  if (typeof window === "undefined") {
    // Server-side: check env variable
    return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  }
  // Client-side: check env variable (injected by Next.js)
  return (process.env.NEXT_PUBLIC_DEMO_MODE as string | undefined) === "true";
};
