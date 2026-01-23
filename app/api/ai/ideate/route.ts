import { NextRequest, NextResponse } from "next/server";
import { sendClaudeMessage } from "@/lib/claude";
import { IDEATION_PROMPT, buildIdeationContext } from "@/lib/prompts-clean";
import type { Challenge, MarketAnalysis, BusinessIdea } from "@/types/innovation";

export async function POST(request: NextRequest) {
  try {
    const { challenge, marketAnalysis, userInput, conversationHistory } = await request.json();

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge data is required" },
        { status: 400 }
      );
    }

    // Build context from challenge and market
    const context = buildIdeationContext(
      challenge as Challenge,
      marketAnalysis as MarketAnalysis
    );

    // Build messages with conversation history
    const messages = [
      ...(conversationHistory || []),
      {
        role: "user" as const,
        content: userInput || `Generate business ideas for this innovation challenge:\n\n${context}`,
      },
    ];

    // Call Claude
    const response = await sendClaudeMessage<BusinessIdea[]>(
      messages,
      IDEATION_PROMPT,
      8000
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to generate ideas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Ideation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
