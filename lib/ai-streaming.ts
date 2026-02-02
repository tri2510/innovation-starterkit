import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  ProgressUpdateSchema,
  MarketProgressUpdateSchema,
  ChallengeSummarySchema,
  MarketAnalysisSchema,
  BusinessIdeaSchema,
  PitchDeckSchema,
  StructuredAIResponseSchema
} from './schemas';
import type {
  ProgressUpdate,
  MarketProgressUpdate,
  ChallengeSummary,
  MarketAnalysis,
  BusinessIdea,
  PitchDeck,
  StructuredAIResponse
} from './schemas';
import type { MarketProgressUpdateChunk } from '@/hooks/use-chat-streaming';
import { executeAPIRequest } from './api-client';
import { config } from './config';

// Initialize Anthropic client (compatible with existing setup)
const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
  baseURL: config.anthropic.baseURL,
});

// Get model from config
const getModel = () => {
  return config.anthropic.defaultModel;
};

/**
 * Stream chat response with progress updates
 * NEW ARCHITECTURE: Break into sub-calls for reliability
 * 1. Conversation: Natural chat (no JSON required)
 * 2. Extraction: Pull structured data from conversation
 * 3. Progress: Determine next field/status
 */
export async function streamChatResponseWithProgress(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  callbacks: {
    onProgress?: (text: string) => void;
    onProgressUpdate?: (update: ProgressUpdate | MarketProgressUpdate) => void;
    onComplete?: (data: any) => void;
    onError?: (error: Error) => void;
  }
) {
  return executeAPIRequest(async () => {
    // SUB-CALL 1: Natural conversation with user
    let conversationalResponse = "";
    
    const stream = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 8192, // Increased from 4096 to prevent cutoff
      system: systemPrompt,
      messages: messages as any,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        conversationalResponse += text;
        
        if (callbacks.onProgress) {
          callbacks.onProgress(text);
        }
      }
    }

    // SUB-CALL 2: Extract structured data from the conversation
    // Detect if this is a market analysis conversation
    const isMarketAnalysis = systemPrompt.includes('market analyst') || systemPrompt.includes('Market Analysis');

    if (isMarketAnalysis) {
      // Use market-specific extraction
      const marketProgressUpdate = await extractMarketProgressFromConversation(
        conversationalResponse,
        messages,
        systemPrompt
      );

      if (marketProgressUpdate && callbacks.onProgressUpdate) {
        callbacks.onProgressUpdate(marketProgressUpdate);
      }

      // Check for market final summary
      const marketFinalSummary = checkForMarketFinalSummary(conversationalResponse);
      if (marketFinalSummary && callbacks.onComplete) {
        callbacks.onComplete({
          type: 'summary',
          data: marketFinalSummary
        });
        return;
      }
    } else {
      // Use challenge-specific extraction
      const progressUpdate = await extractProgressFromConversation(
        conversationalResponse,
        messages,
        systemPrompt
      );

      if (progressUpdate && callbacks.onProgressUpdate) {
        callbacks.onProgressUpdate(progressUpdate);
      }

      // Check for final summary completion
      const finalSummary = checkForFinalSummary(conversationalResponse);
      if (finalSummary && callbacks.onComplete) {
        callbacks.onComplete({
          type: 'summary',
          data: finalSummary
        });
        return;
      }
    }

    // If no structured data, treat as question
    if (callbacks.onComplete) {
      callbacks.onComplete({
        type: 'question',
        data: conversationalResponse.trim()
      });
    }
  }, {
    context: {
      operation: 'stream_chat_response',
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length
    }
  });
}

/**
 * Get structured AI response with guaranteed schema validation
 * Uses Anthropic SDK with manual parsing and Zod validation with retry logic
 */
export async function getStructuredAIResponse<T>(
  prompt: string,
  systemPrompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  return executeAPIRequest(async () => {
    const response = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 8192, // Increased from 4096 to prevent cutoff
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response');
    }

    // Extract JSON from response
    let jsonStr = content.text;
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    // Parse and validate with Zod
    const parsed = JSON.parse(jsonStr.trim());
    return schema.parse(parsed) as T;
  }, {
    context: {
      operation: 'structured_ai_response',
      promptLength: prompt.length,
      schemaName: schema.description || 'unknown'
    }
  });
}

/**
 * Extract progress update from conversation using dedicated AI call
 * This is much more reliable than trying to get AI to maintain format during chat
 */
async function extractProgressFromConversation(
  aiResponse: string,
  conversationHistory: Array<{ role: string; content: string }>,
  originalSystemPrompt: string
): Promise<ProgressUpdate | null> {
  try {
    const extractionPrompt = `You are a conversation analyst filling out innovation form cards from user consultation.

${originalSystemPrompt}

## Current Conversation
${formatConversationForExtraction(conversationHistory, aiResponse)}

## Your Task
Fill out the innovation form cards by extracting structured data in this exact JSON format:

\`\`\`json
{
  "field": "problem|targetAudience|currentSolutions|industry|context",
  "status": "gathering|awaiting_confirmation|complete", 
  "excerpt": "Professional innovation form language based on user input"
}
\`\`\`

## Card Filling Rules
- Treat each field as a professional innovation form card
- Extract the MOST RELEVANT field based on conversation content
- **Smart Context Gathering**: If user mentions timeline/deadline, budget constraints, technical requirements, business models, or specific operational details → set field to "context", status to "gathering"
- **IMPORTANT**: When AI asks for confirmation (checking understanding, summarizing, asking "did I get this right", "Does that accurately capture", "Is that correct") → Set status to "awaiting_confirmation" to show confirmation buttons
- If AI is asking for confirmation (checking understanding, summarizing, asking "did I get this right") → Set status to "awaiting_confirmation", update excerpt with what AI understood
- If user responds with agreement (yes/correct/exactly/that's right/perfect) to AI's confirmation question:
  - Set field to the topic being confirmed
  - Set status to "complete"
  - Set excerpt to PROFESSIONAL INNOVATION FORM LANGUAGE of what AI understood
- If user provided NEW insights about any topic:
  - Set field to the topic they're discussing
  - Set status to "gathering"
  - Set excerpt to PROFESSIONAL INNOVATION FORM LANGUAGE (polished, business-ready)
- If AI is now exploring a different field after confirmation:
  - Set field to the NEW topic AI is exploring
  - Set status to "gathering"
  - Set excerpt to "Exploring [topic name]"

## Innovation Form Style Guidelines
- MINIMAL changes - only clean up obvious issues
- Remove conversational filler words: "I think", "maybe", "sort of", "like", "um", "uh", "something"
- Fix basic punctuation (periods, commas)
- Remove excessive repetition
- Keep user's exact wording and terminology
- Don't "upgrade" language or change to business terms
- Preserve user's communication style and voice

Example transformation:
- User says: "I think schools need better ways to track student attendance, like maybe an app or something"
- Card excerpt: "Schools need better ways to track student attendance, like apps or other tools."

Return ONLY the JSON, no additional text`;

    const response = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 500,
      system: extractionPrompt,
      messages: [{ role: 'user', content: 'Extract the progress update from this conversation.' }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response');
    }
    const responseText = content.text;

    // Parse the extracted JSON
    let progressUpdate = null;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        progressUpdate = ProgressUpdateSchema.parse(parsed);
        console.log('[extractProgressFromConversation] Successfully extracted:', progressUpdate);
      } catch (e) {
        console.warn('[extractProgressFromConversation] JSON parse failed:', e);
      }
    } else {
      try {
        const parsed = JSON.parse(responseText);
        progressUpdate = ProgressUpdateSchema.parse(parsed);
        console.log('[extractProgressFromConversation] Successfully extracted (direct):', progressUpdate);
      } catch (e) {
        console.warn('[extractProgressFromConversation] Direct JSON parse failed:', e);
      }
    }

    return progressUpdate;
  } catch (error) {
    console.error('[extractProgressFromConversation] Extraction failed:', error);
    return null;
  }
}

/**
 * Extract market progress update from market analysis conversation
 * Returns partial structured data for real-time UI updates
 */
async function extractMarketProgressFromConversation(
  aiResponse: string,
  conversationHistory: Array<{ role: string; content: string }>,
  originalSystemPrompt: string
): Promise<MarketProgressUpdate | null> {
  try {
    const extractionPrompt = `You are a conversation analyst filling out market analysis sections from user consultation.

${originalSystemPrompt}

## Current Conversation
${formatConversationForExtraction(conversationHistory, aiResponse)}

## Your Task
Fill out the market analysis sections by extracting structured data in this exact JSON format:

\`\`\`json
{
  "section": "market_size | trends | competitors | opportunities | challenges",
  "status": "gathering | awaiting_confirmation | complete",
  "excerpt": "brief summary from conversation (10-30 words)",
  "partialData": {
    "tam": "Total Addressable Market value or null",
    "sam": "Serviceable Addressable Market value or null",
    "som": "Serviceable Obtainable Market value or null",
    "trends": [
      {"name": "trend name", "description": "brief description", "momentum": "rising|stable|declining"}
    ],
    "competitors": [
      {"name": "company name", "strengths": "key strengths", "marketShare": "share or null"}
    ],
    "opportunities": ["opportunity 1", "opportunity 2"],
    "challenges": ["challenge 1", "challenge 2"]
  }
}
\`\`\`

Rules:
- Return ONLY valid JSON, no markdown
- Select the section MOST discussed in this conversation
- Set status based on user's certainty level
- Extract ALL values mentioned for the current section, even if incomplete
- For market_size: extract any TAM/SAM/SOM values mentioned (can be individual values)
- For trends: extract each trend mentioned with name, description, momentum
- For competitors: extract each competitor mentioned with name and details
- For opportunities/challenges: extract each item mentioned as array items
- Use null for fields not yet discussed`;

    const response = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 1000,
      system: extractionPrompt,
      messages: [{ role: 'user', content: 'Extract the market progress update from this conversation.' }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response');
    }
    const responseText = content.text;

    // Parse the extracted JSON
    let marketProgressUpdate = null;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        marketProgressUpdate = MarketProgressUpdateSchema.parse(parsed);
        console.log('[extractMarketProgressFromConversation] Successfully extracted:', marketProgressUpdate);
      } catch (e) {
        console.warn('[extractMarketProgressFromConversation] JSON parse failed:', e);
      }
    } else {
      try {
        const parsed = JSON.parse(responseText);
        marketProgressUpdate = MarketProgressUpdateSchema.parse(parsed);
        console.log('[extractMarketProgressFromConversation] Successfully extracted (direct):', marketProgressUpdate);
      } catch (e) {
        console.warn('[extractMarketProgressFromConversation] Direct JSON parse failed:', e);
      }
    }

    return marketProgressUpdate;
  } catch (error) {
    console.error('[extractMarketProgressFromConversation] Extraction failed:', error);
    return null;
  }
}

/**
 * Format conversation for extraction analysis
 */
function formatConversationForExtraction(
  conversationHistory: Array<{ role: string; content: string }>,
  latestAIResponse: string
): string {
  let formatted = '';
  
  conversationHistory.forEach((msg, index) => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    formatted += `${index + 1}. ${role}: ${msg.content}\n`;
  });
  
  formatted += `\nLatest AI Response: ${latestAIResponse}`;
  
  return formatted;
}

/**
 * Check if the conversation contains a final summary
 */
function checkForFinalSummary(text: string): ChallengeSummary | null {
  const finalSummary = parseFinalSummary(text);
  if (finalSummary) {
    console.log('[checkForFinalSummary] Found final summary:', finalSummary);
    return finalSummary;
  }
  return null;
}

/**
 * Check if the conversation contains a market final summary
 */
function checkForMarketFinalSummary(text: string): MarketAnalysis | null {
  const marketFinalSummary = parseMarketFinalSummary(text);
  if (marketFinalSummary) {
    console.log('[checkForMarketFinalSummary] Found market final summary:', marketFinalSummary);
    return marketFinalSummary;
  }
  return null;
}
function parseStructuredJSONResponse(text: string): StructuredAIResponse | null {
  try {
    // Try direct JSON parse first (clean prompts should produce this)
    const parsed = JSON.parse(text.trim());
    return StructuredAIResponseSchema.parse(parsed) as StructuredAIResponse;
  } catch (error) {
    // Fallback: try extracting from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        return StructuredAIResponseSchema.parse(parsed) as StructuredAIResponse;
      } catch (e) {
        console.warn('[parseStructuredJSONResponse] Code block parse failed:', e);
      }
    }
    return null;
  }
}

/**
 * Parse PROGRESS_UPDATE from AI response text
 * Fixed to handle nested JSON structure: {message, progress_update: {field, status, excerpt}}
 */
function parseProgressUpdates(text: string): ProgressUpdate[] {
  const updates: ProgressUpdate[] = [];

  // Debug: Log the raw response text
  console.log('[parseProgressUpdates] DEBUG: Raw response text length:', text.length);
  console.log('[parseProgressUpdates] DEBUG: Raw response preview:', text.substring(0, 200));
  console.log('[parseProgressUpdates] DEBUG: Contains "progress_update":', text.includes('progress_update'));
  console.log('[parseProgressUpdates] DEBUG: Contains "message":', text.includes('message'));
  console.log('[parseProgressUpdates] DEBUG: Contains "```":', text.includes('```'));

  // First, try to find complete structured responses with nested progress_update
  const structuredPattern = /```(?:json)?\s*(\{[\s\S]*?"message"[\s\S]*?"progress_update"[\s\S]*?\{[\s\S]*?\}[\s\S]*?\})\s*```/g;
  
  let match;
  structuredPattern.lastIndex = 0;
  
  while ((match = structuredPattern.exec(text)) !== null) {
    try {
      const fullResponse = JSON.parse(match[1]);
      if (fullResponse.progress_update) {
        const update = ProgressUpdateSchema.parse(fullResponse.progress_update);
        updates.push(update);
        console.log('[parseProgressUpdates] Found nested progress_update:', update);
      }
    } catch (error) {
      console.warn('[parseProgressUpdates] Failed to parse structured response:', match[1], error);
    }
  }

  // Fallback: try direct progress_update objects (for backward compatibility)
  const directPattern = /```(?:json)?\s*(\{[\s\S]*?"field"[\s\S]*?"status"[\s\S]*?"excerpt"[\s\S]*?\})\s*```/g;
  directPattern.lastIndex = 0;
  
  while ((match = directPattern.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const update = ProgressUpdateSchema.parse(parsed);
      updates.push(update);
      console.log('[parseProgressUpdates] Found direct progress_update:', update);
    } catch (error) {
      console.warn('[parseProgressUpdates] Failed to parse direct progress update:', match[1], error);
    }
  }

  console.log(`[parseProgressUpdates] Total updates found: ${updates.length}`);
  return updates;
}

/**
 * Removed - clean prompts should produce consistent format
 */


/**
 * Parse FINAL_SUMMARY from AI response text
 */
function parseFinalSummary(text: string): ChallengeSummary | null {
  // Look for JSON containing FINAL_SUMMARY
  // Try to find the outermost JSON object
  const jsonMatch = text.match(/\{[\s\S]*"FINAL_SUMMARY"\s*:\s*\{[\s\S]*\}[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.FINAL_SUMMARY) {
      return ChallengeSummarySchema.parse(parsed.FINAL_SUMMARY);
    }
    return null;
  } catch (error) {
    console.warn('Failed to parse final summary:', jsonMatch[0], error);
    return null;
  }
}

/**
 * Parse FINAL_SUMMARY from Market Analysis AI response text
 */
function parseMarketFinalSummary(text: string): MarketAnalysis | null {
  // Look for JSON containing FINAL_SUMMARY for market analysis
  const jsonMatch = text.match(/\{[\s\S]*"FINAL_SUMMARY"\s*:\s*\{[\s\S]*\}[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.FINAL_SUMMARY) {
      return MarketAnalysisSchema.parse(parsed.FINAL_SUMMARY);
    }
    return null;
  } catch (error) {
    console.warn('Failed to parse market final summary:', jsonMatch[0], error);
    return null;
  }
}

/**
 * Context-aware inference for progress updates when JSON format breaks
 * Analyzes conversation flow to determine current field and status
 */
function inferProgressFromContext(
  aiResponse: string,
  conversationHistory: Array<{ role: string; content: string }>
): ProgressUpdate | null {
  console.log('[inferProgressFromContext] Analyzing conversation context...');
  
  // Get the last user message to understand what was confirmed
  const lastUserMessage = conversationHistory
    .filter(msg => msg.role === 'user')
    .pop()?.content?.toLowerCase() || '';
  
  // Get the previous AI response to understand what field we were working on
  const previousAiResponse = conversationHistory
    .filter(msg => msg.role === 'assistant')
    .pop()?.content?.toLowerCase() || '';
  
  console.log('[inferProgressFromContext] Last user message:', lastUserMessage.substring(0, 50));
  console.log('[inferProgressFromContext] Current AI response:', aiResponse.substring(0, 50));

  // Check if user confirmed something (yes/correct/proceed/good)
  const userConfirmed = /\b(yes|correct|proceed|good|great|perfect|sounds right|that's it)\b/i.test(lastUserMessage);
  
  // Determine current field based on AI response content
  let currentField: 'problem' | 'targetAudience' | 'currentSolutions' | 'industry' | 'context' = 'problem';
  
  if (/who.*face|target|audience|specifically| designing.*for/i.test(aiResponse)) {
    currentField = 'targetAudience';
  } else if (/existing.*solution|current.*method|what.*use|gap|limitation/i.test(aiResponse)) {
    currentField = 'currentSolutions';
  } else if (/industry|sector|field|market/i.test(aiResponse)) {
    currentField = 'industry';
  } else if (/context|background|more.*detail|additional/i.test(aiResponse)) {
    currentField = 'context';
  }

  // Determine status and excerpt based on confirmation
  if (userConfirmed) {
    // User confirmed previous field, so this is a transition to new field
    return {
      field: currentField,
      status: 'gathering',
      excerpt: 'Starting new field after confirmation'
    };
  } else {
    // User provided new information
    const excerpt = extractUserContent(aiResponse, conversationHistory);
    return {
      field: currentField,
      status: 'awaiting_confirmation',
      excerpt: excerpt || 'Waiting for confirmation'
    };
  }
}

/**
 * Extract user's content from AI response (remove AI questions)
 */
function extractUserContent(
  aiResponse: string,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  // Get the last user message
  const lastUserMessage = conversationHistory
    .filter(msg => msg.role === 'user')
    .pop()?.content || '';
  
  if (lastUserMessage.length > 0) {
    // Clean up the user message (remove confirmation phrases)
    const cleaned = lastUserMessage
      .replace(/^(yes|no|correct|right|proceed|okay|sure|thanks|please)\b[,.]?\s*/i, '')
      .trim();
    
    return cleaned.length > 5 ? cleaned.substring(0, 200) : lastUserMessage.substring(0, 200);
  }
  
  return 'Information provided';
}

/**
 * Market analysis with guaranteed structure
 */
export async function getMarketAnalysis(
  challenge: ChallengeSummary
): Promise<MarketAnalysis> {
  const prompt = `Based on this innovation challenge, provide a comprehensive market analysis:

Challenge:
- Problem: ${challenge.problem}
- Target Audience: ${challenge.targetAudience}
- Existing Solutions: ${challenge.currentSolutions}
${challenge.industry ? `- Industry: ${challenge.industry}` : ''}

Provide specific market size estimates, competitive analysis, trends, and strategic insights.`;

  return getStructuredAIResponse(
    prompt,
    "You are an expert market analyst providing detailed market intelligence and competitive analysis.",
    MarketAnalysisSchema
  );
}

/**
 * Generate business ideas with guaranteed structure
 */
export async function generateBusinessIdeas(
  challenge: ChallengeSummary,
  market?: MarketAnalysis,
  strategicFocus?: { industries: string[]; technologies: string[] }
): Promise<BusinessIdea[]> {
  let prompt = `Generate 3-5 innovative business ideas based on:

Challenge:
- Problem: ${challenge.problem}
- Target Audience: ${challenge.targetAudience}
- Existing Solutions: ${challenge.currentSolutions}`;

  if (market) {
    prompt += `

Market Analysis:
- TAM: ${market.tam}
- SAM: ${market.sam}
- SOM: ${market.som}
- Key Trends: ${market.trends.map(t => t.name).join(', ')}`;
  }

  if (strategicFocus) {
    prompt += `

Strategic Focus Areas:
- Industries: ${strategicFocus.industries.join(', ')}
- Technologies: ${strategicFocus.technologies.join(', ')}`;
  }

  prompt += `

Generate innovative, feasible business ideas that solve the identified problem. Prioritize ideas that align with the strategic focus areas if provided. Evaluate each idea across the 6 weighted criteria and provide constructive feedback.`;

  return getStructuredAIResponse(
    prompt,
    "You are an expert innovation strategist generating and evaluating business ideas with mentoring feedback.",
    z.array(BusinessIdeaSchema)
  );
}

/**
 * Generate pitch deck with guaranteed structure
 */
export async function generatePitchDeck(
  challenge: ChallengeSummary,
  selectedIdea: BusinessIdea,
  market?: MarketAnalysis
): Promise<PitchDeck> {
  const prompt = `Create a compelling investor pitch deck for:

Business Idea:
- Name: ${selectedIdea.name}
- Tagline: ${selectedIdea.tagline}
- Description: ${selectedIdea.description}
- Business Model: ${selectedIdea.businessModel}
- Competitive Advantage: ${selectedIdea.competitiveAdvantage}

Challenge Context:
- Problem: ${challenge.problem}
- Target Audience: ${challenge.targetAudience}

${market ? `
Market Analysis:
- TAM: ${market.tam}
- SAM: ${market.sam}
- SOM: ${market.som}
` : ''}

Create a compelling 7-slide investor pitch that tells a clear story and makes a strong case for investment.`;

  return getStructuredAIResponse(
    prompt,
    "You are an expert pitch deck creator crafting compelling investor presentations that secure funding.",
    PitchDeckSchema
  );
}

/**
 * Conversational AI response (no structure required) with retry logic
 */
export async function getConversationalResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  return executeAPIRequest(async () => {
    const response = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 8192, // Increased from 4096 to prevent cutoff
      system: systemPrompt,
      messages: [
        ...conversationHistory.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        { role: 'user', content: userMessage }
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response');
    }

    return content.text;
  }, {
    context: {
      operation: 'conversational_response',
      messageCount: conversationHistory.length,
      userMessageLength: userMessage.length
    }
  });
}

// Export types for use in components
export type {
  ProgressUpdate,
  ChallengeSummary, 
  MarketAnalysis,
  BusinessIdea,
  PitchDeck
};