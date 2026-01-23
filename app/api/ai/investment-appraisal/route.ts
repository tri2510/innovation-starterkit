import { NextRequest, NextResponse } from 'next/server';
import { executeAPIRequest } from '@/lib/api-client';
import { getConversationalResponse } from '@/lib/ai-streaming';

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { messages, investment, systemPrompt, currentProgress, challenge, marketAnalysis, selectedIdea } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Build context from previous phases
    let contextFromPhases = "";

    if (challenge) {
      contextFromPhases += `
## Challenge Context (from Phase 1)
- Problem: ${challenge.problem}
- Target Audience: ${challenge.targetAudience}
- Industry: ${challenge.industry || "Not specified"}
`;
    }

    if (marketAnalysis) {
      contextFromPhases += `
## Market Analysis (from Phase 2)
- TAM: ${marketAnalysis.tam}
- SAM: ${marketAnalysis.sam}
- SOM: ${marketAnalysis.som}
`;
    }

    if (selectedIdea) {
      contextFromPhases += `
## Selected Business Idea (from Phase 3)
- Name: ${selectedIdea.name}
- Tagline: ${selectedIdea.tagline}
- Investment: ${selectedIdea.estimatedInvestment || "N/A"}
- ROI: ${selectedIdea.metrics?.roi || "N/A"}
- Market Fit: ${selectedIdea.metrics?.marketFit || "N/A"}
`;
    }

    // Enhanced system prompt with context
    const enhancedSystemPrompt = `${contextFromPhases}
${systemPrompt}

## Current Project Context
- Project Name: ${investment.name}
- Tagline: ${investment.tagline}
- Description: ${investment.description}
${investment.businessModel ? `- Business Model: ${investment.businessModel}` : ''}
${investment.revenueStreams ? `- Revenue Streams: ${investment.revenueStreams.join(', ')}` : ''}
${investment.estimatedInvestment ? `- Estimated Investment: ${investment.estimatedInvestment}` : ''}
${investment.timeframe ? `- Timeframe: ${investment.timeframe}` : ''}

## Current Progress
- Current Section: ${currentProgress.currentSection}
- Completed Sections: ${currentProgress.completedSections.join(', ') || 'None'}
- Progress: ${currentProgress.progressPercentage}%

Remember to:
1. Reference the challenge problem and market size when building financial projections
2. Consider the target audience and market fit when estimating revenue potential
3. Ask specific, quantifiable questions
4. Provide realistic financial ranges when user is unsure
5. Confirm each section before proceeding
6. Calculate financial metrics based on industry standards
7. Be constructive and educational in your feedback`;

    // Get the user's last message
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
    
    // Get conversation history (excluding the last user message)
    const conversationHistory = messages.slice(0, -1);

    const response = await executeAPIRequest(() =>
      getConversationalResponse(
        lastUserMessage,
        conversationHistory,
        enhancedSystemPrompt
      )
    );

    return NextResponse.json({
      success: true,
      data: { message: response }
    });

  } catch (error) {
    console.error('Investment appraisal API error:', error);
    
    // User-friendly error messages
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'API configuration error. Please check your API key.';
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. The server took too long to respond.';
        statusCode = 504;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}