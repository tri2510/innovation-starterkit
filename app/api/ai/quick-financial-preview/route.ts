import { NextRequest, NextResponse } from 'next/server';
import { sendClaudeMessage } from '@/lib/claude';
import type {
  BusinessIdea,
  MarketAnalysis,
  Challenge,
  QuickFinancialPreview,
  RadarScores,
} from '@/types/innovation';
import { getRadarComparison } from '@/lib/innovation-database';

// System prompt for financial projection generation
const FINANCIAL_PREVIEW_SYSTEM = `You are a financial analyst specializing in innovation and startup projections. You generate simplified 5-year financial projections for business ideas.

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object
- NO markdown code blocks (no \`\`\`)
- NO explanatory text before or after the JSON
- NO comments in the JSON
- Start your response with the opening brace {
- End your response with the closing brace }
- All values must be properly typed (numbers for metrics, strings for text)`;

const USER_PROMPT_TEMPLATE = `Generate a QUICK 5-year financial projection for this business idea.

**Business Idea:**
Name: {{NAME}}
Tagline: {{TAGLINE}}
Description: {{DESCRIPTION}}
Problem Solved: {{PROBLEM}}

**Market Context:**
TAM: {{TAM}}
SAM: {{SAM}}
SOM: {{SOM}}

**Industry:** {{INDUSTRY}}
**Technologies:** {{TECHNOLOGIES}}

**Instructions:**
Generate a simplified 5-year financial projection (Years 1-5). Focus on realistic but optimistic projections that meet these investment gates:
- Gate 1: Break-even must occur within 3 years
- Gate 2: 5-year cumulative ROI should aim for ≥150%

Return JSON with this exact structure:
{
  "fiveYearCumulativeROI": <percentage number>,
  "breakEvenYear": <number 1-5>,
  "totalInvestment": "<formatted string like $2.5M>",
  "year5Revenue": "<formatted string like $10M>",
  "assumptions": "<brief 2-3 sentence explanation>",
  "radarScores": {
    "marketFit": <0-100>,
    "innovation": <0-100>,
    "financialViability": <0-100>,
    "strategicFit": <0-100>,
    "riskLevel": <0-100>,
    "marketSize": <0-100>
  }
}

**Radar Score Guidelines:**
- marketFit: Solution-market fit (problem clarity + trends)
- innovation: Innovation level (market creation = higher)
- financialViability: ROI and revenue potential
- strategicFit: Alignment with {{INDUSTRY}} + {{PRIMARY_TECH}}
- riskLevel: Risk-adjusted viability (higher = better, break-even matters)
- marketSize: TAM/SAM/SOM potential

**Rules:**
1. Break-even ≤ 3 years (Gate 1)
2. Aim for ROI ≥ 150% (Gate 2)
3. Consider market size: {{TAM}}
4. Base on {{INDUSTRY}} industry benchmarks
5. Optimistic but grounded
6. Return ONLY the JSON object, nothing else`;

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

  // Generate database comparison using innovation database utility
  const databaseComparison = getRadarComparison(idea, aiResult.radarScores);

  return {
    ...aiResult,
    gate1Status,
    gate2Status,
    databaseComparison,
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

    // Generate quick financial preview using AI
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
