import { NextRequest } from "next/server";
import { streamClaudeMessage, ClaudeMessage } from "@/lib/claude";
import { getSession } from "@/lib/session";
import { INVESTMENT_APPRAISAL_PROMPT } from "@/lib/prompts-clean";
import type { ChatMessage, MarketAnalysis, BusinessIdea } from "@/types/innovation";

const APPRAISAL_ASSISTANT_PROMPT = `You are an expert financial analyst and investment advisor assisting users with their investment appraisal.

## CRITICAL: AVOID CONFIRMATION BIAS

**Important**: You are receiving context from previous phases (Challenge, Market, Ideation). Be aware that:
- The challenge and market analysis may have been optimized to support each other
- The idea was specifically designed to fit this challenge
- Previous AI evaluations may have been overly optimistic

**Your responsibility**: Be realistic, not optimistic. You must:
1. **Question assumptions**: If metrics seem inflated, suggest conservative alternatives
2. **Identify risks**: Highlight what could go wrong, not just what could go right
3. **Be independent**: Don't just validate previous analysis - challenge it constructively

Your role is to:
- Answer questions about the business model, financial projections, and investment analysis
- Help users modify and update their appraisal data
- Update specific sections when requested (target market, business model, costs, revenue, financial metrics, risks)
- Provide insights on financial viability, ROI, and investment recommendations
- Suggest ways to refine or improve their financial projections

IMPORTANT - Response Format:
- For general questions: Respond naturally with conversational text only
- For update/modification requests: Respond with conversational text FIRST, then include a JSON code block at the VERY END with this EXACT format:

\`\`\`json
{
  "APPRAISAL_UPDATE": {
    "targetMarket": "..." | null,
    "businessModel": "..." | null,
    "revenueStreams": ["...", "..."] | null,
    "competitiveAdvantage": "..." | null,
    "estimatedInvestment": "$..." | null,
    "timeframe": "..." | null,
    "metrics": {
      "marketFit": 0-100 | null,
      "feasibility": 0-100 | null,
      "innovation": 0-100 | null,
      "roi": "high|medium|low" | null,
      "risk": "high|medium|low" | null,
      "overallScore": 0-100 | null,
      "problemClarity": {"score": 0-100, "weight": 0.35, "feedback": "..."} | null,
      "marketSize": {"score": 0-100, "weight": 0.10, "feedback": "..."} | null,
      "innovation": {"score": 0-100, "weight": 0.10, "feedback": "..."} | null,
      "financialViability": {"score": 0-100, "weight": 0.15, "feedback": "..."} | null,
      "strategicFit": {"score": 0-100, "weight": 0.05, "feedback": "..."} | null,
      "marketFit": {"score": 0-100, "weight": 0.25, "feedback": "..."} | null
    } | null,
    "personnelCosts": {
      "team": [{"role": "...", "headcount": 1, "annualSalary": "$...", "equity": "..."}] | null,
      "totalAnnual": "$..." | null,
      "totalWithBenefits": "$..." | null
    } | null,
    "operatingExpenses": {
      "items": [{"category": "...", "monthly": "$...", "annual": "$..."}] | null,
      "totalMonthly": "$..." | null,
      "totalAnnual": "$..." | null
    } | null,
    "capitalInvestments": {
      "items": [{"category": "...", "amount": "$...", "description": "..."}] | null,
      "totalInitial": "$..." | null
    } | null,
    "revenueForecasts": {
      "year1": {"projected": "$...", "growth": "...", "assumptions": "..."} | null,
      "year2": {"projected": "$...", "growth": "...", "assumptions": "..."} | null,
      "year3": {"projected": "$...", "growth": "...", "assumptions": "..."} | null,
      "year4": {"projected": "$...", "growth": "...", "assumptions": "..."} | null,
      "year5": {"projected": "$...", "growth": "...", "assumptions": "..."} | null
    } | null,
    "financialAnalysis": {
      "totalInvestment": "$..." | null,
      "fiveYearRevenue": "$..." | null,
      "fiveYearProfitAfterExpenses": "$..." | null,
      "roi": "..." | null,
      "paybackPeriod": "..." | null,
      "npv": "$..." | null,
      "irr": "..." | null,
      "breakEvenPoint": "..." | null
    } | null,
    "riskAssessment": {
      "riskLevel": "low|medium|high" | null,
      "viabilityScore": "..." | null,
      "keyRisks": ["..."] | null,
      "mitigations": ["..."] | null,
      "recommendation": "..." | null
    } | null
  }
}
\`\`\`

CRITICAL RULES:
- ONLY include the JSON block when user explicitly asks to UPDATE, MODIFY, or CHANGE the appraisal
- Set to null for sections/fields that are not being changed
- The JSON block must be the LAST thing in your response - after all conversational text
- Do NOT include the JSON block for general questions or explanations

Be:
- Specific and data-driven
- Honest about risks and challenges
- Strategic in your guidance
- Helpful in exploring alternatives
- Professional in your analysis

Keep responses concise but informative.`;

export async function POST(request: NextRequest) {
  const { userInput, conversationHistory, challenge, marketAnalysis, selectedIdea, appraisalData } = await request.json();

  console.log("Investment appraisal assistant API call:", { userInput, hasAppraisal: !!appraisalData, hasSelectedIdea: !!selectedIdea });

  // Get session for context
  const session = getSession();

  // Use provided challenge/market/idea or fall back to session
  const currentChallenge = challenge || session?.challenge;
  const currentMarketAnalysis = marketAnalysis || session?.marketAnalysis;
  const currentIdea = selectedIdea || (session?.selectedIdeaId && session?.ideas?.find((i) => i.id === session.selectedIdeaId));

  // If no appraisal exists, use interactive guidance flow
  const isInteractiveFlow = !appraisalData;
  const systemPrompt = isInteractiveFlow ? INVESTMENT_APPRAISAL_PROMPT : APPRAISAL_ASSISTANT_PROMPT;

  // Build context from challenge, market, and idea
  let context = "";

  if (currentChallenge) {
    context += `
Challenge:
- Problem: ${currentChallenge.problem}
- Target Audience: ${currentChallenge.targetAudience}
- Industry: ${currentChallenge.industry || "Not specified"}
`;
  }

  if (currentMarketAnalysis) {
    context += `

Market Analysis:
- TAM: ${currentMarketAnalysis.tam}
- SAM: ${currentMarketAnalysis.sam}
- SOM: ${currentMarketAnalysis.som}`;
  }

  if (currentIdea) {
    context += `

Selected Business Idea:
- Name: ${currentIdea.name}
- Tagline: ${currentIdea.tagline}
- Description: ${currentIdea.description || "N/A"}
- Problem Solved: ${currentIdea.problemSolved || "N/A"}`;

    if (currentIdea.targetMarket) {
      context += `
- Target Market: ${currentIdea.targetMarket}`;
    }
    if (currentIdea.businessModel) {
      context += `
- Business Model: ${currentIdea.businessModel}`;
    }
    if (currentIdea.competitiveAdvantage) {
      context += `
- Competitive Advantage: ${currentIdea.competitiveAdvantage}`;
    }
    if (currentIdea.estimatedInvestment) {
      context += `
- Investment: ${currentIdea.estimatedInvestment}`;
    }
    if (currentIdea.timeframe) {
      context += `
- Timeline: ${currentIdea.timeframe}`;
    }
    if (currentIdea.metrics) {
      context += `
- ROI: ${currentIdea.metrics.roi || "medium"}
- Market Fit: ${currentIdea.metrics.marketFit || "N/A"}
- Overall Score: ${currentIdea.metrics.overallScore || "N/A"}`;
    }
  }

  // Add current appraisal data for modification flow
  if (appraisalData) {
    context += `

Current Appraisal Data:`;
    if (appraisalData.targetMarket) {
      context += `
- Target Market: ${appraisalData.targetMarket}`;
    }
    if (appraisalData.businessModel) {
      context += `
- Business Model: ${appraisalData.businessModel}`;
    }
    if (appraisalData.competitiveAdvantage) {
      context += `
- Competitive Advantage: ${appraisalData.competitiveAdvantage}`;
    }
    if (appraisalData.financialAnalysis) {
      context += `

Financial Model:
- Total Investment: ${appraisalData.financialAnalysis.totalInvestment || "N/A"}
- ROI: ${appraisalData.financialAnalysis.roi || "N/A"}
- Payback: ${appraisalData.financialAnalysis.paybackPeriod || "N/A"}`;
    }
    if (appraisalData.riskAssessment) {
      context += `
- Risk Level: ${appraisalData.riskAssessment.riskLevel || "N/A"}`;
    }
  }

  // Build messages
  const messages: ClaudeMessage[] = [
    ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: `${context.trim()}\n\nUser: ${userInput}`,
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
        let lastStreamedPosition = 0;
        let inJsonBlock = false;
        let jsonBlockStart = -1;

        for await (const chunk of streamClaudeMessage(messages, systemPrompt)) {
          fullResponse += chunk;

          // Check for JSON code block start (```json or ```)
          if (!inJsonBlock && jsonBlockStart === -1) {
            const jsonStart = fullResponse.indexOf("```json");
            const altJsonStart = fullResponse.indexOf("```");
            // Use the first match, but only if it's a valid code block start
            if (jsonStart !== -1) {
              jsonBlockStart = jsonStart;
            } else if (altJsonStart !== -1 && jsonStart === -1) {
              // Only use ``` if it's not already followed by more text that looks like markdown
              const afterAltStart = fullResponse.substring(altJsonStart + 3);
              if (afterAltStart.trim().startsWith("json") || afterAltStart.trim().startsWith("{") || afterAltStart.trim().startsWith("[")) {
                jsonBlockStart = altJsonStart;
              }
            }
          }

          // Check if we're in a JSON block and find its end
          if (jsonBlockStart !== -1) {
            if (!inJsonBlock) {
              // Stream everything before the JSON block
              if (lastStreamedPosition < jsonBlockStart) {
                const contentToStream = fullResponse.substring(lastStreamedPosition, jsonBlockStart);
                if (contentToStream.trim()) {
                  safeEnqueue(`data: ${JSON.stringify({ chunk: contentToStream })}\n\n`);
                }
              }
              lastStreamedPosition = jsonBlockStart;
              inJsonBlock = true;
            }

            // Look for the end of the JSON block
            const afterStart = fullResponse.substring(jsonBlockStart + 3); // Skip ```
            // Find the closing ``` after the opening
            const closingIndex = afterStart.indexOf("\n```");

            if (closingIndex !== -1) {
              // JSON block is complete
              const endPosition = jsonBlockStart + closingIndex + 7; // +3 for ```, +4 for \n```
              lastStreamedPosition = endPosition;

              // Check if there's content after the JSON block
              if (endPosition < fullResponse.length) {
                const afterJson = fullResponse.substring(endPosition);
                if (afterJson.trim()) {
                  safeEnqueue(`data: ${JSON.stringify({ chunk: afterJson })}\n\n`);
                }
              }

              inJsonBlock = false;
              jsonBlockStart = -1;
              lastStreamedPosition = fullResponse.length;
            }
          } else if (!inJsonBlock) {
            // Stream content normally (not in JSON block)
            if (fullResponse.length > lastStreamedPosition) {
              const contentToStream = fullResponse.substring(lastStreamedPosition);
              if (contentToStream.trim()) {
                safeEnqueue(`data: ${JSON.stringify({ chunk: contentToStream })}\n\n`);
              }
              lastStreamedPosition = fullResponse.length;
            }
          }
        }

        // Handle JSON data extraction (both FINAL_SUMMARY and APPRAISAL_UPDATE)
        let jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        let jsonStr = jsonMatch ? jsonMatch[1] : null;

        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr.trim());

            if (parsed.FINAL_SUMMARY) {
              safeEnqueue(`data: ${JSON.stringify({ done: true, type: "appraisal_update", data: parsed.FINAL_SUMMARY })}\n\n`);
              if (!controllerClosed) {
                controller.close();
                controllerClosed = true;
              }
              return;
            }

            if (parsed.APPRAISAL_UPDATE) {
              safeEnqueue(`data: ${JSON.stringify({ done: true, type: "appraisal_update", data: parsed.APPRAISAL_UPDATE })}\n\n`);
              if (!controllerClosed) {
                controller.close();
                controllerClosed = true;
              }
              return;
            }
          } catch (e) {
            console.error("Failed to parse JSON from response:", e);
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
