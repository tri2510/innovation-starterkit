import { NextRequest, NextResponse } from 'next/server';
import { sendClaudeMessage } from '@/lib/claude';
import type {
  BusinessIdea,
  MarketAnalysis,
  Challenge,
  QuickFinancialPreview,
  RadarScores,
} from '@/types/innovation';
import { validateFinancialProjections } from '@/lib/financial-calculator';

// System prompt for financial projection generation
const FINANCIAL_PREVIEW_SYSTEM = `You are a financial analyst specializing in innovation and startup projections.

## CRITICAL: AVOID CONFIRMATION BIAS

**Important**: You are receiving context from previous phases (Challenge, Market, Ideation). Be aware that:
- The challenge and market analysis may have been optimized to support each other
- The idea was specifically designed to fit this challenge

**Your responsibility**: Be realistic, not optimistic. You must:
1. **Question assumptions**: If market size seems inflated, use conservative estimates
2. **Consider competition**: Factor in competitive pressure on pricing and growth
3. **Be conservative**: Use realistic growth rates, not best-case scenarios

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object
- NO markdown code blocks (no \`\`\`)
- NO explanatory text before or after the JSON
- NO comments in the JSON
- Start your response with the opening brace {
- End your response with the closing brace }
- All values must be properly typed (numbers for metrics, strings for text)`;

const USER_PROMPT_TEMPLATE = `Generate a RESEARCH-BASED 5-year financial projection for this business idea.

**Business Idea:**
Name: {{NAME}}
Tagline: {{TAGLINE}}
Description: {{DESCRIPTION}}
Problem Solved: {{PROBLEM}}

**Market Context:**
- TAM: {{TAM}}
- SAM: {{SAM}}
- SOM: {{SOM}}
- Industry: {{INDUSTRY}}
- Technologies: {{TECHNOLOGIES}}

## CRITICAL: RESEARCH-BASED CALCULATIONS REQUIRED

**Your calculations must be based on REAL market research and industry statistics:**

1. **Research Industry Benchmarks**: Use actual {{INDUSTRY}} industry data:
   - Average pricing in this sector (not what you think it should be)
   - Typical customer acquisition rates for similar products
   - Average growth rates for {{INDUSTRY}} startups (usually 20-50% YoY, not 150%)
   - Realistic market penetration rates (0.1-1% per year, not 5-10%)

2. **Use Previous Year Statistics**:
   - Research what similar companies achieved in Years 1-5
   - Use actual case studies from {{INDUSTRY}}
   - Base projections on documented startup performance, not optimism

3. **Conservative Estimation**:
   - Assume slower growth than best-case scenarios
   - Include realistic churn rates (20-30% annually)
   - Account for competition and market saturation
   - Price pressure over time (pricing may decrease, not increase)

4. **Show Your Research**:
   - Cite specific industry reports or benchmarks
   - Reference actual company performance when possible
   - Explain why your assumptions are realistic, not optimistic

**Financial Projections Requirements:**

1. **Pricing Model**: Research actual pricing in {{INDUSTRY}}
   - What do competitors charge? (Use real numbers)
   - Is there pricing pressure? (Prices often drop 10-20% over 5 years)
   - Example: "Based on {{INDUSTRY}} benchmarks: Competitor A charges $X, Competitor B charges $Y"

2. **Customer Acquisition**: Use realistic penetration rates
   - Year 1: 0.1-0.5% of target market (not 1-5%)
   - Year-over-year growth: 20-50% (not 100-200%)
   - Account for churn (20-30% annual customer loss)
   - Example: "Based on {{INDUSTRY}} SaaS benchmarks: 30% avg Y1 growth"

3. **Revenue Calculation**: Show conservative math
   - Year 1: (Customers × Pricing) - Churn losses
   - Growth slows each year (50% → 40% → 30% → 20%)
   - Example: "Year 1: 50 customers × $5K = $250K (15% churn = $212K net)"

4. **Growth Rates**: Use industry-averaged rates
   - Research {{INDUSTRY}} startup growth rates
   - Typical: Year 1-2 (30-50%), Year 3-4 (20-30%), Year 5+ (10-20%)
   - NOT: 150% → 100% → 80% (this is unrealistic)

5. **Cost Structure**: Use real salary data
   - Research {{INDUSTRY}} salary benchmarks (levels.fyi, glassdoor)
   - Include realistic benefits (20-25% overhead)
   - Account for inflation in costs

**Radar Scores - BASED ON REALITY:**
- Be conservative in scoring
- A score of 70-80 is good, not 85-95
- Account for execution risk, market risk, competition risk

Return JSON with this exact structure:
{
  "fiveYearCumulativeROI": <percentage number - be realistic, 20-80% is more realistic than 150%+>,
  "breakEvenYear": <number 1-5 - most startups break even in Year 3-4, not Year 1-2>,
  "totalInvestment": "<formatted string - include realistic runway, $1.5M-3M typical>",
  "year5Revenue": "<formatted string - based on researched growth rates, not optimism>",
  "assumptions": "<DETAILED METHODOLOGY: Show ALL research sources, cite specific benchmarks, explain WHY each number is realistic. Include: 'Based on [specific industry report/benchmark]' references.>",
  "radarScores": {
    "marketFit": <0-100 - be conservative, 60-75 is more realistic than 85+>,
    "innovation": <0-100>,
    "financialViability": <0-100 - account for execution risk>,
    "strategicFit": <0-100>,
    "riskLevel": <0-100 - higher = better, but be realistic about risks>,
    "marketSize": <0-100>
  }
}

**Example CONSERVATIVE assumptions:**
"FINANCIAL PROJECTIONS (Based on Research):
Pricing: $8,000/year (based on {{INDUSTRY}} competitor analysis: Competitor A $7.5K, Competitor B $9K)
Customer acquisition:
- Year 1: 40 customers (0.2% of $20M SOM, per {{INDUSTRY}} benchmarks)
- Year 2: 56 customers (40% growth, per SaaS industry avg of 30-50%)
- Year 3: 73 customers (30% growth, market maturing)
- Year 4: 88 customers (20% growth, saturation effects)
- Year 5: 97 customers (10% growth, highly competitive)
Revenue (accounting for 25% annual churn):
- Year 1: 40 × $8K = $320K (net after 25% churn)
- Year 2: 56 × $8K = $448K
- Total 5-year: $2.1M (conservative, not optimistic)
Growth: 40% → 30% → 20% → 10% (based on {{INDUSTRY}} SaaS maturity curve)
Costs: $1.8M initial (seed round typical for {{INDUSTRY}}), $180K/month ops
Sources: '{{INDUSTRY}} Industry Report 2024', 'SaaS Metrics Benchmark 2023', 'Levels.fyi salary data', 'CB Insights startup report'

**Rules:**
1. Use REAL industry benchmarks, not optimistic assumptions
2. Growth rates should be 20-50%, not 100-200%
3. Market penetration: 0.1-1%, not 5-10%
4. Include churn (20-30% annually)
5. Cite specific sources/research
6. Be conservative - a 30-50% ROI is realistic, 150%+ is unlikely
7. Return ONLY the JSON object, nothing else`;

/**
 * Generate financial preview using AI with transparent calculations
 * AI shows its work in the assumptions field
 */
async function generateQuickFinancialPreview(
  idea: BusinessIdea,
  marketAnalysis: MarketAnalysis,
  challenge: Challenge
): Promise<QuickFinancialPreview> {
  const industry = idea.searchFields?.industries?.[0] || 'manufacturing';
  const technologies = idea.searchFields?.technologies || [];
  const primaryTech = technologies[0] || 'emerging tech';

  // Build prompt with template variables
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{NAME}}', idea.name)
    .replace('{{TAGLINE}}', idea.tagline)
    .replace('{{DESCRIPTION}}', idea.description)
    .replace('{{PROBLEM}}', idea.problemSolved)
    .replace('{{TAM}}', marketAnalysis.tam)
    .replace('{{SAM}}', marketAnalysis.sam)
    .replace('{{SOM}}', marketAnalysis.som)
    .replace('{{INDUSTRY}}', industry)
    .replace('{{TECHNOLOGIES}}', technologies.join(', '))
    .replace('{{PRIMARY_TECH}}', primaryTech);

  const response = await sendClaudeMessage<{
    fiveYearCumulativeROI: number;
    breakEvenYear: number;
    totalInvestment: string;
    year5Revenue: string;
    assumptions: string;
    radarScores: RadarScores;
  }>(
    [{ role: 'user', content: prompt }],
    FINANCIAL_PREVIEW_SYSTEM,
    3000
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to generate financial preview');
  }

  const aiResult = response.data;

  // Validate and calculate gate status
  const gate1Status = aiResult.breakEvenYear <= 3 ? 'met' : 'not-met';
  const gate2Status = aiResult.fiveYearCumulativeROI >= 150 ? 'met' : 'not-met';

  // Use AI-generated radar scores for consistency with full appraisal
  // These scores are based on AI analysis of the idea's viability
  const radarScores = aiResult.radarScores;

  return {
    fiveYearCumulativeROI: aiResult.fiveYearCumulativeROI,
    breakEvenYear: aiResult.breakEvenYear,
    totalInvestment: aiResult.totalInvestment,
    year5Revenue: aiResult.year5Revenue,
    assumptions: aiResult.assumptions, // AI's detailed explanation
    radarScores,
    gate1Status,
    gate2Status,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea, marketAnalysis, challenge } = body as {
      idea: BusinessIdea;
      marketAnalysis: MarketAnalysis;
      challenge: Challenge;
    };

    if (!idea || !marketAnalysis) {
      return NextResponse.json(
        { success: false, error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Generate quick financial preview using AI with transparent calculations
    const preview = await generateQuickFinancialPreview(idea, marketAnalysis, challenge);

    return NextResponse.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    console.error('Error generating quick financial preview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      },
      { status: 500 }
    );
  }
}
