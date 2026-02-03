import { NextRequest, NextResponse } from "next/server";
import { sendClaudeMessage } from "@/lib/claude";
import {
  IDEATION_PROMPT,
  IDEATION_EVALUATION_PROMPT,
  buildIdeationContext,
} from "@/lib/prompts-clean";
import type { Challenge, MarketAnalysis, BusinessIdea } from "@/types/innovation";

// Type for the generation phase output (without metrics/evaluation)
type GeneratedIdea = Omit<BusinessIdea, "metrics" | "evaluation"> & {
  brief: string; // brief is required from generation
};

// Type for the evaluation phase input
type EvaluatedIdea = {
  id: string;
  metrics: BusinessIdea["metrics"];
  evaluation: BusinessIdea["evaluation"];
};

/**
 * Shuffle array to prevent positional bias during evaluation
 * Ideas presented in same order as generated may receive biased scores
 */
function shuffleIdeas<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  try {
    const { challenge, marketAnalysis, userInput, conversationHistory, skipEvaluation = false } =
      await request.json();

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

    const generationMessages = [
      ...(conversationHistory || []),
      {
        role: "user" as const,
        content:
          userInput ||
          `Generate business ideas for this innovation challenge:\n\n${context}`,
      },
    ];

    // === PHASE 1: GENERATION ===
    console.log("[Ideation API] Phase 1: Generating ideas with briefs...");

    const generationResponse = await sendClaudeMessage<GeneratedIdea[]>(
      generationMessages,
      IDEATION_PROMPT,
      8000
    );

    if (!generationResponse.success) {
      return NextResponse.json(
        {
          error:
            generationResponse.error || "Failed to generate ideas",
          phase: "generation",
        },
        { status: 500 }
      );
    }

    const generatedIdeas = generationResponse.data;

    if (!generatedIdeas || generatedIdeas.length === 0) {
      return NextResponse.json(
        { error: "No ideas were generated" },
        { status: 500 }
      );
    }

    console.log(
      `[Ideation API] Generated ${generatedIdeas.length} ideas with briefs`
    );

    // Skip evaluation if requested (for faster initial generation)
    if (skipEvaluation) {
      console.log("[Ideation API] Skipping evaluation phase as requested");
      return NextResponse.json({
        success: true,
        data: generatedIdeas.map((idea) => ({
          ...idea,
          metrics: undefined,
          evaluation: undefined,
        })),
      });
    }

    // === PHASE 2: EVALUATION ===
    console.log("[Ideation API] Phase 2: Evaluating ideas independently...");

    // Shuffle ideas to prevent positional bias from generation order
    // This ensures evaluation is independent of generation sequence
    const shuffledIdeas = shuffleIdeas(generatedIdeas);
    console.log(`[Ideation API] Shuffled ideas for bias reduction (order randomized)`);

    // Build evaluation context with full challenge, market, and generated ideas
    const evaluationContext = `## Challenge Context
${context}

## Ideas to Evaluate

**NOTE**: These ideas are presented in RANDOM ORDER. Evaluate each idea independently based on its merits, not its position in this list.

${shuffledIdeas
  .map(
    (idea, index) => `
### Idea ${index + 1}: ${idea.name}
**ID**: ${idea.id}
**Tagline**: ${idea.tagline}
**Description**: ${idea.description}
**Problem Solved**: ${idea.problemSolved}
**Search Fields**:
- Industries: ${idea.searchFields?.industries.join(", ") || "none"}
- Technologies: ${idea.searchFields?.technologies.join(", ") || "none"}
- Reasoning: ${idea.searchFields?.reasoning || "none"}

**Detailed Brief**:
${idea.brief || "No brief provided"}
`
  )
  .join("\n---\n")}

---

## Critical Evaluation Instructions

**IMPORTANT**: You are acting as an INDEPENDENT, CRITICAL evaluator. Your role is to:

1. **Be objective and skeptical** - Look for flaws, assumptions, and risks
2. **Compare ideas relative to each other** - Not all ideas deserve high scores
3. **Use the full score range** - Don't cluster scores around 70-80; spread them based on real differences
4. **Identify weaknesses first** - Before finding strengths, identify what could go wrong
5. **Challenge assumptions** - What would need to be true for this to work?

**Score Distribution Guidelines**:
- 90-100: Exceptional, rare, breakthrough idea with minimal risks
- 75-89: Strong idea with clear advantages but some limitations
- 60-74: Viable idea with significant trade-offs or risks
- Below 60: Major flaws or unrealistic assumptions

Please evaluate these ideas critically and provide objective scores.`;

    const evaluationMessages = [
      {
        role: "user" as const,
        content: evaluationContext,
      },
    ];

    const evaluationResponse = await sendClaudeMessage<EvaluatedIdea[]>(
      evaluationMessages,
      IDEATION_EVALUATION_PROMPT,
      8000
    );

    if (!evaluationResponse.success) {
      console.error(
        "[Ideation API] Evaluation failed, returning generated ideas without metrics:",
        evaluationResponse.error
      );
      // Return generated ideas even if evaluation fails
      return NextResponse.json({
        success: true,
        data: generatedIdeas.map((idea) => ({
          ...idea,
          metrics: undefined,
          evaluation: undefined,
        })),
        warning:
          "Ideas were generated but evaluation failed. Please try evaluating again.",
      });
    }

    const evaluatedIdeas = evaluationResponse.data;

    if (!evaluatedIdeas || evaluatedIdeas.length === 0) {
      console.error(
        "[Ideation API] Evaluation returned no data, returning generated ideas without metrics"
      );
      return NextResponse.json({
        success: true,
        data: generatedIdeas.map((idea) => ({
          ...idea,
          metrics: undefined,
          evaluation: undefined,
        })),
        warning:
          "Ideas were generated but evaluation failed. Please try evaluating again.",
      });
    }

    console.log(
      `[Ideation API] Successfully evaluated ${evaluatedIdeas.length} ideas`
    );

    // === PHASE 3: MERGE RESULTS ===
    // Combine generated ideas with their evaluations
    const finalIdeas: BusinessIdea[] = generatedIdeas.map((idea) => {
      const evaluation = evaluatedIdeas.find((ev) => ev.id === idea.id);

      if (!evaluation) {
        console.warn(
          `[Ideation API] No evaluation found for idea ${idea.id}, returning without metrics`
        );
        return {
          ...idea,
          metrics: undefined,
          evaluation: undefined,
        };
      }

      return {
        ...idea,
        metrics: evaluation.metrics,
        evaluation: evaluation.evaluation,
      };
    });

    return NextResponse.json({
      success: true,
      data: finalIdeas,
    });
  } catch (error) {
    console.error("Ideation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
