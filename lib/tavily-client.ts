/**
 * Tavily API Client for AI Web Search
 * 
 * Tavily is specifically designed for AI applications with:
 * - Real-time web search optimized for LLMs
 * - Clean, structured JSON responses
 * - Generous free tier (1,000 requests/month)
 * - Simple REST API (no complex protocols)
 * 
 * Documentation: https://docs.tavily.com/docs/tavily-api/rest-api
 */

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content: string;
}

interface TavilyResponse {
  answer: string;
  query: string;
  response_time: number;
  images: Array<{
    url: string;
    description: string;
  }>;
  results: TavilySearchResult[];
}

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

/**
 * Perform web search using Tavily API
 * 
 * @param query - Search query
 * @param options - Search parameters
 * @returns Formatted results compatible with existing UI
 */
export async function tavilySearch(
  query: string,
  options?: {
    max_results?: number;
    search_depth?: "basic" | "advanced";
    topic?: "general" | "news";
    days?: number;
    api_key?: string;
  }
): Promise<Array<{
  refer: string;
  title: string;
  link: string;
  media: string;
  content: string;
  icon: string;
  publish_date: string;
}>> {
  const apiKey = options?.api_key || process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    console.error("[Tavily] No API key found. Set TAVILY_API_KEY in .env.local");
    return [];
  }

  try {
    console.log(`[Tavily] Searching for: "${query.slice(0, 50)}"`);
    
    const response = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: options?.max_results || 10,
        search_depth: options?.search_depth || "basic",
        topic: options?.topic || "general",
        days: options?.days || 3,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data: TavilyResponse = await response.json();
    console.log(`[Tavily] ✓ SUCCESS: ${data.results.length} results in ${data.response_time}ms`);

    // Transform Tavily results to match existing UI format
    return data.results.map((result, index) => ({
      refer: `ref_${index + 1}`,
      title: result.title,
      link: result.url,
      media: new URL(result.url).hostname,
      content: result.content,
      icon: "", // Tavily doesn't provide favicons
      publish_date: "", // Tavily doesn't provide dates in basic search
    }));

  } catch (error) {
    console.error("[Tavily] Search failed:", error);
    return [];
  }
}

/**
 * Simple health check for Tavily API
 */
export async function checkTavilyHealth(): Promise<boolean> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log("[Tavily] No API key configured");
    return false;
  }

  try {
    const result = await tavilySearch("test query", { max_results: 1, api_key: apiKey });
    return result.length > 0;
  } catch {
    return false;
  }
}