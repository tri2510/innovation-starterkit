/**
 * Z.AI MCP Web Search Client
 *
 * Simple client for Z.AI's web search server via MCP protocol
 * Documentation: https://docs.z.ai/devpack/mcp/search-mcp-server
 *
 * Note: The Z.AI MCP server handles stateless requests - we can call tools directly
 * without needing initialize/notifications/initialized sequence.
 */

interface WebSearchResult {
  refer: string;
  title: string;
  link: string;
  media: string;
  content: string;
  icon: string;
  publish_date: string;
}

const MCP_ENDPOINT = "https://api.z.ai/api/mcp/web_search_prime/mcp";
let mcpRequestId = 0;
let mcpInitialized = false;

/**
 * Send a JSON-RPC request to the MCP server and parse SSE response
 *
 * Based on successful Python implementation - simple and direct approach
 */
async function sendMCPRequest(
  method: string,
  params?: unknown,
  apiKey?: string
): Promise<unknown> {
  const requestId = ++mcpRequestId;
  const effectiveApiKey = apiKey || process.env.ANTHROPIC_API_KEY;

  const message: Record<string, unknown> = {
    jsonrpc: "2.0" as const,
    id: requestId,
    method,
  };

  if (params) {
    message.params = params;
  }

  console.log(`[MCP] Sending ${method} request`, {
    id: requestId,
    apiKey: effectiveApiKey ? `${effectiveApiKey.slice(0, 10)}...` : "none"
  });

  const response = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${effectiveApiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
  }

  // Parse SSE response - EXACT approach like Python
  const text = await response.text();
  const lines = text.split("\n").filter((line) => line.trim().startsWith("data:"));

  for (const line of lines) {
    const data = line.slice(5).trim();
    try {
      const parsed = JSON.parse(data);
      if (parsed.id === requestId) {
        if (parsed.error) {
          throw new Error(`MCP error: ${JSON.stringify(parsed.error)}`);
        }
        console.log(`[MCP] Got response for request ${requestId}:`, parsed.result ? "success" : "empty");
        return parsed.result;
      }
    } catch (parseError) {
      console.log(`[MCP] Skipping non-JSON or invalid line:`, data.slice(0, 100));
      // Continue to next line
    }
  }

  throw new Error("No valid response from MCP server");
}

/**
 * Initialize MCP connection (like Python version)
 */
async function initializeMCP(): Promise<void> {
  if (mcpInitialized) {
    console.log("[MCP] Already initialized");
    return;
  }

  const params = {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "typescript-mcp-client",
      version: "1.0.0"
    }
  };

  console.log("[MCP] Initializing MCP connection...");
  const result = await sendMCPRequest("initialize", params) as any;
  console.log("[MCP] Connected to:", result?.serverInfo?.name || "unknown server");
  mcpInitialized = true;
}

/**
 * List available MCP tools (like Python version)
 */
async function listMCPTools(): Promise<any[]> {
  const result = await sendMCPRequest("tools/list") as any;
  return result?.tools || [];
}

/**
 * Perform a web search using the Z.AI MCP web search server (like Python version)
 *
 * @param query - The search query (max 70 chars recommended)
 * @param options - Optional search parameters
 * @returns Array of search results with titles, links, content, etc.
 */
export async function webSearch(
  query: string,
  options?: {
    search_domain_filter?: string;
    search_recency_filter?: "oneDay" | "oneWeek" | "oneMonth" | "oneYear" | "noLimit";
    content_size?: "medium" | "high";
    location?: "cn" | "us";
    apiKey?: string;
  }
): Promise<WebSearchResult[]> {
  try {
    // Follow Python protocol: initialize -> list tools -> call tool
    await initializeMCP();

    const tools = await listMCPTools();
    console.log("[MCP] Available tools:", tools.map((t: any) => t.name).join(", "));

    const result = await sendMCPRequest(
      "tools/call",
      {
        name: "webSearchPrime",
        arguments: {
          search_query: query,
          ...(options?.search_domain_filter && { search_domain_filter: options.search_domain_filter }),
          ...(options?.search_recency_filter && { search_recency_filter: options.search_recency_filter }),
          ...(options?.content_size && { content_size: options.content_size }),
          ...(options?.location && { location: options.location }),
        },
      },
      options?.apiKey
    ) as any;

    console.log(`[MCP] Raw result type:`, result?.constructor?.name);
    console.log(`[MCP] Result keys:`, result ? Object.keys(result) : "no result");

    // Handle result like the working Python version
    if (result && result.content && Array.isArray(result.content) && result.content.length > 0) {
      const jsonString = result.content[0]?.text;
      console.log(`[MCP] Content[0].text type:`, typeof jsonString);
      console.log(`[MCP] Content[0].text preview:`, jsonString?.slice(0, 200));

      if (jsonString) {
        // Try to parse as-is first
        try {
          const searchResults = JSON.parse(jsonString) as WebSearchResult[];
          console.log(`[MCP] ✓ Web search SUCCESS: ${searchResults.length} results for: "${query.slice(0, 50)}"`);
          return searchResults;
        } catch (parseError) {
          console.log(`[MCP] First parse attempt failed:`, parseError);

          // If that fails, try removing quotes and unescaping
          try {
            let cleaned = jsonString;
            if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
              cleaned = jsonString
                .slice(1, -1)
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
            }

            const searchResults = JSON.parse(cleaned) as WebSearchResult[];
            console.log(`[MCP] ✓ Web search SUCCESS (cleaned): ${searchResults.length} results for: "${query.slice(0, 50)}"`);
            return searchResults;
          } catch (secondError) {
            console.log(`[MCP] Second parse attempt failed:`, secondError);
            console.log(`[MCP] Could not parse search result as JSON`);
          }
        }
      }
    }

    // Handle error case like Python version
    if (result && result.isError && result.content && result.content[0]) {
      console.log(`[MCP] Tool returned error:`, result.content[0].text);
      // Don't throw error, just return empty like Python version
      return [];
    }

    console.log(`[MCP] No valid content found in result`);
    return [];
  } catch (error) {
    console.error("[MCP] Web search failed:", error);
    // Return empty array instead of throwing to allow graceful degradation
    return [];
  }
}

/**
 * Reset MCP request ID counter (for testing)
 */
export function resetMCP(): void {
  mcpRequestId = 0;
  mcpInitialized = false;
}
