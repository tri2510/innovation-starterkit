import { NextRequest, NextResponse } from "next/server";
import { sendClaudeMessage } from "@/lib/claude";
import { IDEA_EXPLORATION_PROMPT } from "@/lib/prompts-clean";
import type { BusinessIdea } from "@/types/innovation";

export async function POST(request: NextRequest) {
  try {
    const { idea, question } = await request.json();

    if (!idea || !question) {
      return NextResponse.json(
        { error: "Idea and question are required" },
        { status: 400 }
      );
    }

    // Build context for idea exploration
    const context = `Exploring the following business idea:

Name: ${idea.name}
Tagline: ${idea.tagline}
Description: ${idea.description}
Problem Solved: ${idea.problemSolved}
Target Market: ${idea.targetMarket}
Business Model: ${idea.businessModel}
Revenue Streams: ${idea.revenueStreams.join(", ")}
Competitive Advantage: ${idea.competitiveAdvantage}
Metrics: Market Fit ${idea.metrics.marketFit}%, Feasibility ${idea.metrics.feasibility}%, Innovation ${idea.metrics.innovation}%
Investment: ${idea.estimatedInvestment}
Timeframe: ${idea.timeframe}

User Question: ${question}`;

    // Call Claude
    const response = await sendClaudeMessage<string>(
      [
        {
          role: "user",
          content: context,
        },
      ],
      IDEA_EXPLORATION_PROMPT,
      4000
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to explore idea" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Explore API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
