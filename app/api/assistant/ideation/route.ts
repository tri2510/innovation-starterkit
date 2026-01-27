import { NextRequest } from "next/server";
import { streamClaudeMessage, ClaudeMessage } from "@/lib/claude";
import { getSession } from "@/lib/session";
import type { ChatMessage, BusinessIdea, IdeationSubStep } from "@/types/innovation";

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

## Scoring System Context

Ideas are evaluated across key metrics:
- **Market Fit (0-100)**: How well the solution matches market needs
- **Feasibility (0-100)**: How feasible with current technology and resources
- **Innovation (0-100)**: Level of innovation and novelty
- **Uniqueness (0-100)**: How different from existing solutions
- **ROI**: high, medium, or low
- **Risk**: high, medium, or low

## Search Fields

Ideas are tagged with relevant search fields:
**Industries:** manufacturing, healthcare, automotive, agriculture
**Technologies:** ai-edge, sdv, robotics, virtualization, cloud

IMPORTANT - Response Format:
- For general questions: Respond naturally with conversational text only
- For update/modification requests: Respond with conversational text FIRST, then include a JSON code block at the VERY END with this EXACT format:

\`\`\`json
{
  "IDEAS_UPDATE": {
    "ideas": [
      {
        "id": "...",
        "name": "...",
        "tagline": "...",
        "description": "...",
        "problemSolved": "...",
        "searchFields": {
          "industries": ["manufacturing"],
          "technologies": ["ai-edge", "cloud"],
          "reasoning": "Explanation"
        },
        "metrics": {
          "marketFit": 85,
          "feasibility": 75,
          "innovation": 80,
          "uniqueness": 70,
          "roi": "high|medium|low",
          "risk": "high|medium|low"
        }
      }
    ]
  }
}
\`\`\`

CRITICAL: When updating ideas, you MUST include ALL required fields:
- id, name, tagline, description, problemSolved (required)
- searchFields with industries, technologies, reasoning (required)
- metrics with marketFit, feasibility, innovation, uniqueness, roi, risk (required)
- ALL metrics fields must be included (marketFit, feasibility, innovation, uniqueness, roi, risk)

CRITICAL RULES:
- ONLY include the JSON block when user explicitly asks to UPDATE, MODIFY, or CHANGE an idea
- When updating ONE idea: return ALL ideas in the session (the updated one + all other unchanged ideas)
- Other ideas' scores MUST remain unchanged - only modify the specific idea requested
- The JSON block must be the LAST thing in your response - after all conversational text
- Do NOT include the JSON block for general questions or explanations
- When updating ideas to improve metrics (feasibility, uniqueness, etc.), provide specific improvements in the idea's content that justify the better score
- ALL ideas in the array must include complete metrics (marketFit, feasibility, innovation, uniqueness, roi, risk)
- Adjust your response style based on the current sub-step

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

  // Build context from challenge and market analysis (if available)
  const challengeSection = currentChallenge ? `
Current Challenge:
- Problem: ${currentChallenge.problem}
- Target Audience: ${currentChallenge.targetAudience}
- Industry: ${currentChallenge.industry || "Not specified"}
` : "";

  const marketSection = currentMarketAnalysis ? `
Market Analysis:
- TAM: ${currentMarketAnalysis.tam}
- SAM: ${currentMarketAnalysis.sam}
- SOM: ${currentMarketAnalysis.som}
- Trends: ${currentMarketAnalysis.trends?.map((t: any) => t.name).join(", ") || "N/A"}
- Opportunities: ${currentMarketAnalysis.opportunities?.slice(0, 3).join(", ") || "N/A"}
` : "";

  const selectedIdeaSection = currentSelectedIdea ? `
Selected Idea: ${currentSelectedIdea.name}
- Tagline: ${currentSelectedIdea.tagline}
- Description: ${currentSelectedIdea.description || "N/A"}
- Problem Solved: ${currentSelectedIdea.problemSolved || "N/A"}
- Strategic Focus: ${currentSelectedIdea.searchFields?.technologies?.join(", ") || "N/A"}
${currentSelectedIdea.metrics ? `- Metrics: Market Fit ${currentSelectedIdea.metrics.marketFit}%, Feasibility ${currentSelectedIdea.metrics.feasibility}%, Innovation ${currentSelectedIdea.metrics.innovation}%, ROI ${currentSelectedIdea.metrics.roi}` : "- Metrics: To be generated in appraisal phase"}
` : "";

  const viewingIdeaSection = viewingIdea ? `
Currently Viewing in Detail Panel: ${viewingIdea.name}
- Tagline: ${viewingIdea.tagline}
- Description: ${viewingIdea.description || "N/A"}
- Problem Solved: ${viewingIdea.problemSolved || "N/A"}
- Strategic Focus: ${viewingIdea.searchFields?.technologies?.join(", ") || "N/A"}
${viewingIdea.metrics ? `- Metrics: Uniqueness ${viewingIdea.metrics.uniqueness}%, Feasibility ${viewingIdea.metrics.feasibility}%, Innovation ${viewingIdea.metrics.innovation}%, ROI ${viewingIdea.metrics.roi}` : "- Metrics: To be generated"}
` : "";

  const ideasSummary = currentIdeas ? JSON.stringify(currentIdeas.map((i: BusinessIdea) => ({
    id: i.id,
    name: i.name,
    tagline: i.tagline,
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

  const context = `${challengeSection}${marketSection}${selectedIdeaSection}${viewingIdeaSection}

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
        let bufferedContent = ""; // Buffer content until we know if there's an update

        for await (const chunk of streamClaudeMessage(messages, IDEATION_ASSISTANT_PROMPT)) {
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
              // This prevents "Here is the updated data..." from showing
              lastStreamedPosition = jsonResponseStart;
              inJsonBlock = true;
              hasIdeasUpdate = true;
              bufferedContent = ""; // Clear buffered content
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
              if (bufferedContent.length > 500 && !fullResponse.includes("```")) {
                safeEnqueue(`data: ${JSON.stringify({ chunk: bufferedContent })}\n\n`);
                bufferedContent = "";
              }
            }
          }

          if (fullResponse.includes("IDEAS_UPDATE")) {
            hasIdeasUpdate = true;
          }
        }

        // Stream any remaining buffered content if there's no update
        if (!hasIdeasUpdate && bufferedContent.trim()) {
          safeEnqueue(`data: ${JSON.stringify({ chunk: bufferedContent })}\n\n`);
        }

        // At the end, check if there's an IDEAS_UPDATE to extract
        if (hasIdeasUpdate) {
          // Try to extract JSON from the response
          let jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
          let jsonStr = jsonMatch ? jsonMatch[1] : null;

          if (jsonStr) {
            try {
              const parsed = JSON.parse(jsonStr.trim());

              if (parsed.IDEAS_UPDATE && parsed.IDEAS_UPDATE.ideas && Array.isArray(parsed.IDEAS_UPDATE.ideas)) {
                safeEnqueue(`data: ${JSON.stringify({ done: true, type: "update", data: parsed.IDEAS_UPDATE })}\n\n`);
                controller.close();
                return;
              }
            } catch (e) {
              console.error("Failed to parse IDEAS_UPDATE JSON:", e);
            }
          }
        }

        // If no valid update, send as text response
        safeEnqueue(`data: ${JSON.stringify({ done: true, type: "text", data: fullResponse.trim() })}\n\n`);

        if (!controllerClosed) {
          controller.close();
          controllerClosed = true;
        }
      } catch (error) {
        console.error("Stream error:", error);
        safeEnqueue(`data: ${JSON.stringify({ done: true, type: "error", data: "Failed to process request" })}\n\n`);
        if (!controllerClosed) {
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
