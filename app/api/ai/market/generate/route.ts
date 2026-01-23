import { NextRequest, NextResponse } from "next/server";
import { sendClaudeMessage } from "@/lib/claude";
import { MARKET_GENERATION_PROMPT, buildMarketContext } from "@/lib/prompts-clean";
import type { Challenge, MarketAnalysis } from "@/types/innovation";

export async function POST(request: NextRequest) {
  try {
    const { challenge, conversationHistory } = await request.json();

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge data is required" },
        { status: 400 }
      );
    }

    // Build context from challenge
    const context = buildMarketContext(challenge as Challenge);

    // Build messages with conversation history
    const messages = [
      ...(conversationHistory || []),
      {
        role: "user" as const,
        content: `Generate a comprehensive market analysis for this innovation challenge:\n\n${context}`,
      },
    ];

    // Call Claude with increased token limit for comprehensive analysis
    const response = await sendClaudeMessage<MarketAnalysis>(
      messages,
      MARKET_GENERATION_PROMPT,
      16000
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to generate market analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Market generation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}