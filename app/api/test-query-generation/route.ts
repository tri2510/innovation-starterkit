import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { selectedText, industry, audience } = await request.json();

    console.log("[Test Query Generation] Starting test...");
    console.log("[Test Query Generation] Selected text:", selectedText);
    console.log("[Test Query Generation] Industry:", industry);
    console.log("[Test Query Generation] Audience:", audience);

    // Test different prompt formats
    const testPrompts = [
      // Format 1: Simple conversion
      {
        name: "Simple Conversion",
        prompt: `Convert "${selectedText}" to a ${industry} ${audience} search query.

Example: "TAM" becomes "Total Addressable Market retail small business"

Your response:`
      },
      // Format 2: Direct instruction
      {
        name: "Direct Instruction",
        prompt: `Generate a web search query based on:
- Term: "${selectedText}"
- Industry: ${industry}
- Audience: ${audience}

Return ONLY the search query, nothing else.`
      },
      // Format 3: Few-shot examples
      {
        name: "Few-shot Examples",
        prompt: `Example 1:
Input: "TAM", Industry: "retail", Audience: "small business"
Output: "Total Addressable Market retail small business"

Example 2:
Input: "competitors", Industry: "technology", Audience: "SME"
Output: "technology SME competitors market analysis"

Now generate:
Input: "${selectedText}", Industry: "${industry}", Audience: "${audience}"
Output:`
      }
    ];

    const openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL,
    });

    const results = [];

    for (const test of testPrompts) {
      console.log(`\n[Test Query Generation] Testing: ${test.name}`);
      console.log(`[Test Query Generation] Prompt:`, test.prompt);

      try {
        const response = await openai.chat.completions.create({
          model: config.openai.defaultModel,
          max_tokens: 100,
          messages: [{
            role: "user",
            content: test.prompt
          }]
        });

        const aiResponse = response.choices[0]?.message?.content || "";
        console.log(`[Test Query Generation] Raw response: "${aiResponse}"`);
        console.log(`[Test Query Generation] Response length: ${aiResponse.length}`);

        results.push({
          format: test.name,
          prompt: test.prompt,
          response: aiResponse,
          success: aiResponse.length > 0
        });
      } catch (error) {
        console.error(`[Test Query Generation] Error for ${test.name}:`, error);
        results.push({
          format: test.name,
          prompt: test.prompt,
          response: null,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Also test with higher max_tokens
    console.log(`\n[Test Query Generation] Testing with higher max_tokens...`);
    try {
      const response = await openai.chat.completions.create({
        model: config.openai.defaultModel,
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Generate a search query for "${selectedText}" in the ${industry} industry for ${audience}. Return ONLY the query.`
        }]
      });

      const aiResponse = response.choices[0]?.message?.content || "";
      console.log(`[Test Query Generation] Response with max_tokens=500: "${aiResponse}"`);

      results.push({
        format: "Higher max_tokens (500)",
        prompt: `Generate a search query for "${selectedText}" in the ${industry} industry for ${audience}. Return ONLY the query.`,
        response: aiResponse,
        success: aiResponse.length > 0
      });
    } catch (error) {
      console.error(`[Test Query Generation] Error with higher max_tokens:`, error);
      results.push({
        format: "Higher max_tokens (500)",
        response: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return NextResponse.json({
      config: {
        model: config.openai.defaultModel,
        baseURL: config.openai.baseURL,
        hasApiKey: !!config.openai.apiKey
      },
      input: { selectedText, industry, audience },
      results
    });

  } catch (error) {
    console.error("[Test Query Generation] Test error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Test failed",
      results: []
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test endpoint ready. Send a POST request with: { selectedText, industry, audience }"
  });
}
