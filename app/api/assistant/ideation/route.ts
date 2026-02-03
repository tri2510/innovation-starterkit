import { NextRequest } from "next/server";
import { streamClaudeMessage, ClaudeMessage, sendClaudeMessage } from "@/lib/claude";
import { getSession } from "@/lib/session";
import { buildIdeationContext } from "@/lib/prompts-clean";
import type { ChatMessage, BusinessIdea, IdeationSubStep } from "@/types/innovation";

/**
 * Detect if user is asking to score/evaluate ideas
 */
function isScoringRequest(text: string): boolean {
  const scoringKeywords = [
    "score",
    "evaluate",
    "rate",
    "assess",
    "grade",
    "rank",
    "rating",
    "scoring",
    "metrics"
  ];
  const lowerText = text.toLowerCase();
  return scoringKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Format scored ideas into a readable summary
 */
function formatScoresSummary(scoredIdeas: any[], allIdeas: BusinessIdea[]): string {
  return `Generated scores for ${scoredIdeas.length} idea${scoredIdeas.length > 1 ? 's' : ''}!

${scoredIdeas.map((scored) => {
  const idea = allIdeas.find((i) => i.id === scored.id);
  return `• "${idea?.name || 'Unknown'}": ${Math.round(scored.metrics?.uniqueness || 0)}% unique, ${Math.round(scored.metrics?.feasibility || 0)}% feasible`;
}).join('\n')}

You can ask me to explain these metrics or suggest improvements to increase the scores.`;
}

const IDEATION_ASSISTANT_PROMPT = `You are an expert innovation consultant and business strategist assisting users with their business ideas throughout the ideation process.

Your role varies by the current sub-step:

1. GENERATE SUB-STEP:
- Answer questions about the generated business ideas
- Help users modify and refine their ideas
- Update specific idea fields when requested
- Suggest improvements to increase evaluation scores across all criteria

2. SELECT SUB-STEP:
- Help users compare and contrast different ideas
- Highlight strengths and weaknesses of each idea
- Provide strategic guidance on which idea best fits their goals and market
- Answer questions about evaluation criteria and scores

3. REVIEW SUB-STEP:
- Provide strategic guidance on the selected innovation plan
- Answer questions about strengths, weaknesses, opportunities, and threats
- Help with go-to-market strategy and next steps
- Provide risk assessment and mitigation suggestions

## Understanding User Context

When there's a "Currently Viewing in Detail Panel" section above:
- User is actively viewing that specific idea in the detail panel
- When user says "this idea", "the current idea", "improve this", "help me improve", or similar, they ARE referring to the VIEWING idea
- Focus your response on that specific viewing idea
- DO NOT generate new ideas when user asks to improve "this idea" - modify the viewing idea instead
- ONLY generate new ideas when user explicitly asks: "generate new ideas", "create more ideas", "give me alternatives", etc.

## Scoring System Context

When user asks to score, evaluate, or improve scores, use these EXACT criteria (same as the evaluation API):

### 1. uniqueness (0-100)
**What to assess**: How truly novel is this approach?
- Compare against existing solutions mentioned in the challenge
- Consider technology combinations, business models, target markets
- Score >80: Highly unique, novel approach with clear differentiation
- Score 60-79: Somewhat unique, some differentiation but not groundbreaking
- Score <60: Common approach, incremental improvement, or crowded market

### 2. feasibility (0-100)
**What to assess**: Implementation feasibility with current technology
- Is the technology proven or experimental?
- Are the resource requirements realistic?
- What's the technical complexity and timeline?
- Score >80: Highly feasible with proven tech
- Score 60-79: Moderately feasible, some challenges
- Score <60: Low feasibility, high technical risk

### 3. marketFit (0-100)
**What to assess**: Does this truly address a market need?
- Is the problem real and urgent?
- Do customers actually care about this solution?
- Score >80: Strong market fit, urgent need
- Score 60-79: Moderate market fit, some interest
- Score <60: Weak market fit, solution in search of problem

### 4. innovation (0-100)
**What to assess**: How innovative is the approach?
- Market creation (new market) = higher score (85-100)
- Market improvement (better solution) = medium score (60-84)
- Incremental change (minor improvement) = lower score (40-59)

### 5. roi (high/medium/low)
**What to assess**: Return on investment potential
- **High**: Large addressable market ($10B+), scalable solution, strong margins
- **Medium**: Moderate market ($1-10B), some scalability
- **Low**: Small market (<$1B), limited scalability, low margins

### 6. risk (high/medium/low)
**What to assess**: Overall risk level (INVERTED - high score = low risk)
- **High**: Proven technology, clear market, low execution complexity
- **Medium**: Some risk factors (tech, market, or competition)
- **Low**: Unproven approach, competitive market, or high complexity

**IMPORTANT**: Be critical and conservative in scoring, not optimistic. These are the same criteria used by the evaluation system.

## Search Fields

Ideas are tagged with relevant search fields:
**Industries:** manufacturing, healthcare, automotive, agriculture
**Technologies:** ai-edge, sdv, robotics, virtualization, cloud

IMPORTANT - Response Format:
- For general questions: Respond naturally with conversational text only
- For update/modification/creation/replacement requests: Respond with conversational text FIRST, then include a JSON code block at the VERY END with this EXACT format
- **CRITICAL**: ALWAYS complete the JSON block - never leave it incomplete
- **CRITICAL**: The JSON block must be the LAST thing in your response - nothing after it
- **CRITICAL**: Always close the JSON block properly after all the ideas

\`\`\`json
{
  "IDEAS_UPDATE": {
    "ideas": [
      {
        "id": "unique-id-or-existing-id",
        "name": "...",
        "tagline": "...",
        "description": "...",
        "problemSolved": "...",
        "searchFields": {
          "industries": ["manufacturing"],
          "technologies": ["ai-edge", "cloud"],
          "reasoning": "Explanation"
        },
        "brief": "4-6 sentence detailed explanation including core concept, problem addressed, differentiators, target customers, implementation considerations, and market opportunity",
        "metrics": {
          "uniqueness": <0-100>,
          "feasibility": <0-100>,
          "marketFit": <0-100>,
          "innovation": <0-100>,
          "roi": "high|medium|low",
          "risk": "high|medium|low"
        },
        "evaluation": {
          "strengths": ["strength 1", "strength 2", "strength 3"],
          "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
          "assumptions": ["assumption 1", "assumption 2"],
          "criticalQuestions": ["question 1", "question 2"]
        }
      }
    ]
  }
}
\`\`\`

Note:
- The "metrics" and "evaluation" fields are OPTIONAL. Only include them when user asks to score, evaluate, or improve scores.
- The "brief" field is REQUIRED for new ideas, optional when updating existing ideas (preserve it if it exists)

CRITICAL: When updating ideas, you MUST include ALL required fields:
- id, name, tagline, description, problemSolved (required)
- searchFields with industries, technologies, reasoning (required)
- metrics and evaluation (OPTIONAL - include based on these rules):
  • DO NOT include metrics/evaluation when generating or refining ideas
  • DO NOT include metrics/evaluation when modifying content (description, problem solved, etc.)
  • INCLUDE metrics and evaluation ONLY when user explicitly asks to "score", "evaluate", "improve scores", or similar
  • If an idea already has metrics and you're NOT asked to re-score, preserve its existing metrics (copy them to your response)

CRITICAL RULES:
- **ALWAYS return a COMPLETE list of ideas** in your JSON response - never just the changed ones
- **JSON MUST ALWAYS USE DOUBLE QUOTES** - Never use single quotes for keys or string values
- **When copying existing ideas with nested quotes**, escape inner double quotes with backslashes (e.g., "tagline": "The \"Virtual\" Manager" - NOT 'The "Virtual" Manager')
- **PRESERVE ideas exactly as-is** when copying them - do NOT modify, rewrite, or regenerate ideas you're not explicitly changing
- Include the JSON block when user asks to: UPDATE, MODIFY, CHANGE, CREATE, GENERATE, ADD, or REPLACE ideas
- When user asks to generate/create/add new ideas:
  - Create NEW ideas with unique IDs (use format: "idea-{timestamp}-{random}")
  - Include the NEW ideas PLUS all existing ideas in your response
  - Copy existing ideas EXACTLY as they are - do not modify them
  - New ideas MUST include the "brief" field
  - New ideas should NOT include "metrics" or "evaluation" (they'll be scored separately)
- When updating existing ideas:
  - Use the EXISTING id from the idea being updated
  - Return ALL ideas in the session (the updated one + all other unchanged ideas)
  - Copy unchanged ideas EXACTLY as they appear in the input - do not modify them
  - Preserve the "brief" field if it exists
  - Preserve "metrics" and "evaluation" if not explicitly asked to re-score
- When replacing an idea:
  - Return ALL ideas EXCEPT the one being replaced (the new idea + all other existing ideas)
  - Copy other ideas EXACTLY as they appear in the input - do not modify them
  - The replaced idea should NOT appear in your response
- **CRITICAL**: Maintain the EXACT SAME ORDER as the ideas were provided to you - do NOT reorder them
- Other ideas' scores MUST remain unchanged - only modify the specific idea requested
- The JSON block must be the LAST thing in your response - after all conversational text
- Do NOT include the JSON block for general questions or explanations
- When user asks to improve/increase scores: DO include the NEW improved metrics and evaluation in your response
- Adjust your response style based on the current sub-step

## Generating New Ideas (When user asks "generate new ideas", "create more ideas", "add 3 ideas", etc.)

When user asks to generate/create/add new ideas:
1. Create the requested number of new ideas with unique IDs
2. Each new idea MUST include:
   - id: "idea-{timestamp}-{random-number}" (e.g., "idea-1704067200-1")
   - name, tagline, description, problemSolved
   - searchFields with industries, technologies, reasoning
   - brief: 4-6 sentence detailed explanation
3. Each new idea MUST NOT include metrics or evaluation (they'll be scored separately)
4. Return ALL ideas: the NEW ideas + all EXISTING ideas
5. Maintain the original order of existing ideas (append new ideas at the end)
6. Provide conversational context before the JSON explaining what you've created

Example:
User: "generate 3 new ideas"
You: "I'll generate 3 new innovative ideas for you based on the challenge... [brief description of each idea]. Here are the details:" (then include JSON with 3 new ideas + all existing ideas)

## Replacing Ideas (When user asks "replace this idea", "replace idea X with Y", etc.)

When user asks to replace an idea:
1. Create the NEW replacement idea with a unique ID (different from the one being replaced)
2. Return ALL ideas in your JSON response: the NEW replacement idea + all other EXISTING ideas (excluding the replaced one)
3. **CRITICAL**: Copy all other existing ideas EXACTLY as they are - do NOT modify, rewrite, or regenerate them
4. **CRITICAL**: The replaced idea should NOT appear in your JSON response
5. Clearly state in your conversational response which idea is being replaced and why

Example:
User: "replace 'AI Inventory Manager' with a better idea"
You: "I'll replace 'AI Inventory Manager' with a more innovative approach called 'Smart Inventory Optimization' that uses predictive analytics... [explain why it's better]. Here's the updated list:" (then include JSON with the new idea + all other ideas copied exactly as-is, NOT including the replaced one)

**IMPORTANT**: When copying other ideas, copy ALL fields exactly including name, tagline, description, problemSolved, searchFields, brief, metrics, evaluation. Do not change a single character of ideas you're not replacing.

## Improving Ideas (When user asks "help me improve", "improve this idea", etc.)

When user asks to improve an idea:
1. First, provide CONVERSATIONAL guidance on how to improve it
2. Focus on the viewing idea (when user says "this idea")
3. Suggest specific improvements to content (description, problemSolved, etc.)
4. Suggest improvements to metrics/evaluation if scores are low
5. If you include a JSON update, ONLY modify the viewing idea - do NOT create new ideas
6. Return ALL existing ideas in the JSON (the modified one + all others unchanged)

Example:
User: "help me improve this idea"
You: "I can see your current idea focuses on X. Here are some suggestions... [detailed guidance]. Would you like me to update it with these improvements?" (then optionally include JSON with the improved viewing idea)

Be:
- Specific and data-driven
- Honest about risks and challenges
- Strategic in your guidance
- Helpful in exploring alternatives
- Constructive in feedback (guide, don't benchmark)

Keep responses concise but informative.`;

export async function POST(request: NextRequest) {
  const { userInput, conversationHistory, ideas, challenge, marketAnalysis, selectedIdea, viewingIdea, subStep = "generate" } = await request.json();

  // Get session for context
  const session = getSession();

  // Use provided challenge/marketAnalysis or fall back to session
  const currentChallenge = challenge || session?.challenge;
  const currentMarketAnalysis = marketAnalysis || session?.marketAnalysis;

  // Use provided ideas or fall back to session
  const currentIdeas = ideas || session?.ideas;
  const currentSelectedIdea = selectedIdea || (session?.selectedIdeaId ? currentIdeas?.find((i: BusinessIdea) => i.id === session.selectedIdeaId) : null);

  if (!currentIdeas) {
    return new Response(
      JSON.stringify({ error: "Missing ideas data" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // HYBRID SCORING: Check if user wants to score and has many unscored ideas
  if (isScoringRequest(userInput)) {
    const unscoredIdeas = currentIdeas.filter((i: BusinessIdea) => !i.metrics);

    // If >3 unscored ideas, use batch score API to avoid timeout
    if (unscoredIdeas.length > 3) {
      try {
        console.log(`[Assistant] Detected scoring request for ${unscoredIdeas.length} ideas, using batch score API`);

        // Call the batch score API
        const scoreResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/ideate/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ideas: unscoredIdeas,
            challenge: currentChallenge,
            marketAnalysis: currentMarketAnalysis,
          }),
        });

        const scoreData = await scoreResponse.json();

        if (!scoreData.success) {
          throw new Error('Failed to score ideas');
        }

        const scoredIdeas = scoreData.data;

        // Update ideas with scores
        const updatedIdeas = currentIdeas.map((idea: BusinessIdea) => {
          const scored = scoredIdeas.find((s: any) => s.id === idea.id);
          return scored
            ? { ...idea, metrics: scored.metrics, evaluation: scored.evaluation }
            : idea;
        });

        // Format the response
        const summary = formatScoresSummary(scoredIdeas, updatedIdeas);

        // Return as streaming response for consistency
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, type: "text", data: summary })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, type: "update", data: { IDEAS_UPDATE: { ideas: updatedIdeas } } })}\n\n`));
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      } catch (error) {
        console.error('[Assistant] Batch scoring failed, falling back to AI:', error);
        // Fall through to normal AI response if batch scoring fails
      }
    }
  }

  // Build rich context using buildIdeationContext (same as scoring API)
  const challengeContext = currentChallenge ? buildIdeationContext(currentChallenge, currentMarketAnalysis) : "";

  // Build detailed market section with competitors (missing from buildIdeationContext)
  const marketDetailsSection = currentMarketAnalysis ? `
Market Details:
- Competitors: ${currentMarketAnalysis.competitors?.map((c: any) => c.name).join(", ") || "N/A"}
- All Opportunities: ${currentMarketAnalysis.opportunities?.join("; ") || "N/A"}
- Challenges: ${currentMarketAnalysis.challenges?.join("; ") || "N/A"}
` : "";

  const selectedIdeaSection = currentSelectedIdea ? `
Selected Idea: ${currentSelectedIdea.name}
- Tagline: ${currentSelectedIdea.tagline}
- Description: ${currentSelectedIdea.description || "N/A"}
- Problem Solved: ${currentSelectedIdea.problemSolved || "N/A"}
- Strategic Focus: ${currentSelectedIdea.searchFields?.technologies?.join(", ") || "N/A"}
${currentSelectedIdea.metrics ? `- Metrics: Uniqueness ${currentSelectedIdea.metrics.uniqueness}%, Feasibility ${currentSelectedIdea.metrics.feasibility}%, Innovation ${currentSelectedIdea.metrics.innovation}%, ROI ${currentSelectedIdea.metrics.roi}` : "- Metrics: To be generated in appraisal phase"}
` : "";

  const viewingIdeaSection = viewingIdea ? `
Currently Viewing in Detail Panel: ${viewingIdea.name}
- ID: ${viewingIdea.id}
- Tagline: ${viewingIdea.tagline}
- Description: ${viewingIdea.description || "N/A"}
- Problem Solved: ${viewingIdea.problemSolved || "N/A"}
- Strategic Focus: ${viewingIdea.searchFields?.technologies?.join(", ") || "N/A"}
${viewingIdea.metrics ? `- Metrics: Uniqueness ${viewingIdea.metrics.uniqueness}%, Feasibility ${viewingIdea.metrics.feasibility}%, Innovation ${viewingIdea.metrics.innovation}%, ROI ${viewingIdea.metrics.roi}` : "- Metrics: To be generated"}
${viewingIdea.brief ? `- Detailed Brief: ${viewingIdea.brief}` : ""}
${viewingIdea.evaluation ? `- Evaluation:
  - Strengths: ${viewingIdea.evaluation.strengths?.join("; ") || "N/A"}
  - Weaknesses: ${viewingIdea.evaluation.weaknesses?.join("; ") || "N/A"}
  - Assumptions: ${viewingIdea.evaluation.assumptions?.join("; ") || "N/A"}
  - Critical Questions: ${viewingIdea.evaluation.criticalQuestions?.join("; ") || "N/A"}` : ""}

**IMPORTANT**: When user says "this idea", "the current idea", "improve this", or similar, they ARE referring to the "${viewingIdea.name}" idea that is currently being viewed above.
` : "";

  // Build rich ideas summary with full details (same as scoring API)
  const ideasSummary = currentIdeas ? JSON.stringify(currentIdeas.map((i: BusinessIdea) => ({
    id: i.id,
    name: i.name,
    tagline: i.tagline,
    description: i.description,
    problemSolved: i.problemSolved,
    searchFields: i.searchFields,
    brief: i.brief,
    metrics: i.metrics
  }))) : "None generated yet";

  // Build context based on sub-step
  let subStepContext = "";
  switch (subStep as IdeationSubStep) {
    case "generate":
      subStepContext = "User is in the GENERATE phase - refining and improving generated business ideas.";
      break;
    case "select":
      subStepContext = "User is in the SELECT phase - comparing ideas to choose the best one. Help them understand the trade-offs between different options.";
      break;
    case "review":
      subStepContext = "User is in the REVIEW phase - reviewing their selected innovation plan. Provide strategic guidance, risk analysis, and next steps.";
      break;
  }

  const context = `${challengeContext}

${marketDetailsSection}${selectedIdeaSection}${viewingIdeaSection}

Current Ideas: ${ideasSummary}

${subStepContext}
  `.trim();

  // Build messages
  const messages: ClaudeMessage[] = [
    ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: `${context}\n\nUser: ${userInput}`,
    },
  ];

  // Create a streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let controllerClosed = false;

      const safeEnqueue = (data: string) => {
        if (!controllerClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            controllerClosed = true;
          }
        }
      };

      try {
        let fullResponse = "";
        let hasIdeasUpdate = false;
        let lastStreamedPosition = 0;
        let inJsonBlock = false;
        let bufferedContent = "";

        for await (const chunk of streamClaudeMessage(messages, IDEATION_ASSISTANT_PROMPT, 32768)) {
          fullResponse += chunk;

          // Check if we need to hide any content (inside a JSON block with IDEAS_UPDATE)
          const jsonResponseStart = fullResponse.indexOf("```json");
          const hasIdeasKeyword = fullResponse.includes("IDEAS_UPDATE");

          if (jsonResponseStart !== -1 && hasIdeasKeyword) {
            // We have a JSON block with IDEAS_UPDATE
            const afterJsonStart = fullResponse.substring(jsonResponseStart);
            const jsonResponseEnd = afterJsonStart.indexOf("\n```");

            if (!inJsonBlock) {
              // First time detecting the JSON block - DO NOT stream content before it
              // This prevents opening ```json and { from showing
              lastStreamedPosition = jsonResponseStart;
              inJsonBlock = true;
              hasIdeasUpdate = true;
              bufferedContent = ""; // Clear any buffered content
            }

            if (jsonResponseEnd !== -1) {
              // JSON block is complete - skip it and check for content after
              const endPosition = jsonResponseStart + jsonResponseEnd + 4; // +4 for "\n```"
              lastStreamedPosition = endPosition;

              // Check if there's content after the JSON block
              if (endPosition < fullResponse.length) {
                const afterJson = fullResponse.substring(endPosition);
                if (afterJson.trim()) {
                  safeEnqueue(`data: ${JSON.stringify({ chunk: afterJson })}\n\n`);
                }
                lastStreamedPosition = fullResponse.length;
              }

              inJsonBlock = false;
            }
          } else if (!inJsonBlock) {
            // No JSON block detected yet - buffer content instead of streaming immediately
            // Only stream if we're confident there won't be an update later
            if (fullResponse.length > lastStreamedPosition) {
              const newContent = fullResponse.substring(lastStreamedPosition);
              bufferedContent += newContent;
              lastStreamedPosition = fullResponse.length;

              // Stream buffered content if response is getting long and no JSON block found
              // This prevents holding back regular conversational responses too long
              if (bufferedContent.length > 300 && !fullResponse.includes("```")) {
                safeEnqueue(`data: ${JSON.stringify({ chunk: bufferedContent })}\n\n`);
                bufferedContent = "";
              }
            }
          }
        }

        // Stream any remaining buffered content if there's no update
        if (!hasIdeasUpdate && bufferedContent.trim()) {
          safeEnqueue(`data: ${JSON.stringify({ chunk: bufferedContent })}\n\n`);
        }

        // After streaming completes, check for IDEAS_UPDATE
        if (hasIdeasUpdate) {
          let jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)\n```/);
          let jsonStr = jsonMatch ? jsonMatch[1] : null;

          if (jsonStr) {
            try {
              // Fix common JSON issues: single quotes instead of double quotes
              // This happens when AI copies ideas with quotes in content and uses single quotes to avoid escaping
              let fixedJson = jsonStr.trim();

              // Simple approach: replace single quotes with double quotes
              // But we need to be careful about nested quotes
              // Use a state machine approach to handle this properly
              let result = '';
              let inDoubleQuote = false;
              let inSingleQuote = false;
              let i = 0;

              while (i < fixedJson.length) {
                const char = fixedJson[i];
                const nextChar = fixedJson[i + 1] || '';

                if (char === '\\' && nextChar) {
                  // Escaped character - preserve as-is
                  result += char + nextChar;
                  i += 2;
                  continue;
                }

                if (char === '"' && !inSingleQuote) {
                  inDoubleQuote = !inDoubleQuote;
                  result += char;
                  i++;
                  continue;
                }

                if (char === "'" && !inDoubleQuote) {
                  // Found a single quote outside double quotes
                  // Check if this starts/ends a single-quoted string
                  const remaining = fixedJson.substring(i);
                  const match = remaining.match(/^'([^']*?)'/);
                  if (match) {
                    // Convert to double-quoted with proper escaping
                    const content = match[1];
                    const escapedContent = content.replace(/"/g, '\\"');
                    result += '"' + escapedContent + '"';
                    i += match[0].length;
                    continue;
                  }
                }

                result += char;
                i++;
              }

              const parsed = JSON.parse(result);

              if (parsed.IDEAS_UPDATE && parsed.IDEAS_UPDATE.ideas && Array.isArray(parsed.IDEAS_UPDATE.ideas)) {
                if (!controllerClosed) {
                  safeEnqueue(`data: ${JSON.stringify({ done: true, type: "update", data: parsed.IDEAS_UPDATE })}\n\n`);
                  controller.close();
                  controllerClosed = true;
                }
                return;
              }
            } catch (e) {
              console.error("Failed to parse IDEAS_UPDATE JSON:", e);
              console.error("JSON string length:", jsonStr?.length);
              console.error("First 500 chars:", jsonStr?.substring(0, 500));
            }
          }
        }

        // If no valid update, send as text response
        if (!controllerClosed) {
          safeEnqueue(`data: ${JSON.stringify({ done: true, type: "text", data: fullResponse.trim() })}\n\n`);
          controller.close();
          controllerClosed = true;
        }
      } catch (error) {
        console.error("Stream error:", error);
        if (!controllerClosed) {
          safeEnqueue(`data: ${JSON.stringify({ done: true, type: "error", data: "Failed to process request" })}\n\n`);
          controller.error(error);
          controllerClosed = true;
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
