import { NextRequest, NextResponse } from "next/server";
import { sendClaudeMessage } from "@/lib/claude";
import { SIMPLIFIED_APPRAISAL_PROMPT } from "@/lib/prompts-clean";
import type { Challenge, MarketAnalysis, BusinessIdea } from "@/types/innovation";

export async function POST(request: NextRequest) {
  try {
    const { challenge, marketAnalysis, idea } = await request.json();

    if (!idea || !challenge) {
      return NextResponse.json(
        { success: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    // Build context for the appraisal
    const context = `## Business Challenge
Problem: ${challenge.problem || "N/A"}
Target Audience: ${challenge.targetAudience || "N/A"}
Current Solutions: ${challenge.currentSolutions || "N/A"}

## Market Analysis
TAM: ${marketAnalysis?.tam || "N/A"}
SAM: ${marketAnalysis?.sam || "N/A"}
SOM: ${marketAnalysis?.som || "N/A"}
Industry: ${idea.searchFields?.industries?.[0] || "N/A"}

## Business Idea
Name: ${idea.name}
Tagline: ${idea.tagline}
Description: ${idea.description || "N/A"}
Problem Solved: ${idea.problemSolved || "N/A"}
Brief: ${idea.brief || "N/A"}`;

    const messages = [
      {
        role: "user" as const,
        content: `${context}\n\nGenerate a complete, realistic investment appraisal for this idea. Be conservative in your estimates and ensure all numbers are mathematically consistent.`,
      },
    ];

    const response = await sendClaudeMessage<any>(
      messages,
      SIMPLIFIED_APPRAISAL_PROMPT,
      8000
    );

    if (!response.success || !response.data) {
      console.error("Appraisal generation failed:", response.error);
      return NextResponse.json(
        { success: false, error: response.error || "Failed to generate appraisal" },
        { status: 500 }
      );
    }

    const appraisalData = response.data.FINAL_SUMMARY;
    if (!appraisalData) {
      return NextResponse.json(
        { success: false, error: "Invalid appraisal data structure" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appraisalData,
    });
  } catch (error) {
    console.error("Appraisal API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
