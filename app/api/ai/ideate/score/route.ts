import { NextRequest, NextResponse } from "next/server";
import { sendClaudeMessage } from "@/lib/claude";
import { IDEATION_EVALUATION_PROMPT, buildIdeationContext } from "@/lib/prompts-clean";
import type { Challenge, MarketAnalysis, BusinessIdea } from "@/types/innovation";

// Type for the evaluation phase input
type EvaluatedIdea = {
  id: string;
  metrics: BusinessIdea["metrics"];
  evaluation: BusinessIdea["evaluation"];
};

/**
 * Shuffle array to prevent positional bias during evaluation
 * Ideas in original order may receive biased scores due to position effects
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
    const { ideas, challenge, marketAnalysis } = await request.json();

    if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
      return NextResponse.json(
        { error: "Ideas array is required" },
        { status: 400 }
      );
    }

    console.log(`[Score API] Scoring ${ideas.length} ideas...`);

    // Build full context using buildIdeationContext (same as original evaluation)
    const context = buildIdeationContext(
      challenge as Challenge,
      marketAnalysis as MarketAnalysis
    );

    // Shuffle ideas to prevent positional bias
    // This ensures evaluation is independent of idea ordering
    const shuffledIdeas = shuffleIdeas(ideas);
    console.log(`[Score API] Shuffled ${shuffledIdeas.length} ideas for bias reduction`);

    // Build evaluation context with full challenge, market, and generated ideas
    const evaluationContext = `## Challenge Context
${context}

## Ideas to Evaluate

**NOTE**: These ideas are presented in RANDOM ORDER for unbiased evaluation.
**CRITICAL**: You MUST return the exact same "id" value provided below for each idea.

${shuffledIdeas
  .map(
    (idea: BusinessIdea) => `
### ${idea.name}
**ID (copy exactly)**: \`${idea.id}\`
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
6. **Copy IDs exactly** - The "id" field in your response MUST match exactly (case-sensitive)

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
      16384
    );

    if (!evaluationResponse.success) {
      console.error("[Score API] Evaluation failed:", evaluationResponse.error);
      return NextResponse.json(
        {
          error: evaluationResponse.error || "Failed to score ideas",
        },
        { status: 500 }
      );
    }

    const evaluatedIdeas = evaluationResponse.data;

    if (!evaluatedIdeas || evaluatedIdeas.length === 0) {
      return NextResponse.json(
        { error: "No scores were generated" },
        { status: 500 }
      );
    }

    console.log(`[Score API] Successfully scored ${evaluatedIdeas.length} ideas`);

    // Return the evaluated ideas
    return NextResponse.json({
      success: true,
      data: evaluatedIdeas,
    });
  } catch (error) {
    console.error("Score API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
