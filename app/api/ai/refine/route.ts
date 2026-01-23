import { NextRequest, NextResponse } from "next/server";
import { sendClaudeMessage } from "@/lib/claude";
import { REFINEMENT_PROMPT } from "@/lib/prompts-clean";
import type { InnovationSession } from "@/types/innovation";

export async function POST(request: NextRequest) {
  try {
    const { session, fieldPath, newValue } = await request.json();

    if (!session || !fieldPath || newValue === undefined) {
      return NextResponse.json(
        { error: "Session, fieldPath, and newValue are required" },
        { status: 400 }
      );
    }

    // Build context for refinement
    let context = `The user has edited the following field: "${fieldPath}" to: "${newValue}"`;

    if (session.challenge) {
      context += `\n\nCurrent Challenge:\n- Problem: ${session.challenge.problem}\n- Target: ${session.challenge.targetAudience}`;
    }

    if (session.selectedIdeaId && session.ideas) {
      const selectedIdea = session.ideas.find((i: { id: string }) => i.id === session.selectedIdeaId);
      if (selectedIdea) {
        context += `\n\nSelected Idea: ${selectedIdea.name}\n${selectedIdea.description}`;
      }
    }

    context += `\n\nPlease update the session data to reflect this change and maintain consistency across all related fields. Return the updated session data as JSON.`;

    // Call Claude
    const response = await sendClaudeMessage<Partial<InnovationSession>>(
      [
        {
          role: "user",
          content: context,
        },
      ],
      REFINEMENT_PROMPT,
      6000
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to refine content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Refine API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
