#!/usr/bin/env python3
import requests
import json

class MCPClient:
    def __init__(self, url, api_key):
        self.url = url
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json, text/event-stream"
        }
        self.request_id = 0
    
    def _send_request(self, method, params=None):
        """Send JSON-RPC request to MCP server"""
        self.request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method
        }
        if params:
            payload["params"] = params
        
        response = requests.post(self.url, headers=self.headers, json=payload)
        
        # Parse SSE response
        if response.status_code == 200:
            for line in response.text.strip().split('\n'):
                if line.startswith('data:'):
                    data = json.loads(line[5:])
                    return data
        return None
    
    def initialize(self):
        """Initialize MCP connection"""
        params = {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "python-mcp-client",
                "version": "1.0.0"
            }
        }
        return self._send_request("initialize", params)
    
    def list_tools(self):
        """List available tools"""
        return self._send_request("tools/list")
    
    def call_tool(self, tool_name, arguments):
        """Call a specific tool"""
        params = {
            "name": tool_name,
            "arguments": arguments
        }
        return self._send_request("tools/call", params)

# Example usage
if __name__ == "__main__":
    # Configuration
    MCP_URL = "https://api.z.ai/api/mcp/web_search_prime/mcp"
    API_KEY = "32e4ed9113d840fd82b3c80fd72d943e.1s6a2iZNihycTS9B"
    
    # Create client
    client = MCPClient(MCP_URL, API_KEY)
    
    # Initialize connection
    print("Initializing MCP connection...")
    init_result = client.initialize()
    print(f"Connected to: {init_result['result']['serverInfo']['name']}")
    
    # List available tools
    print("\nAvailable tools:")
    tools_result = client.list_tools()
    for tool in tools_result['result']['tools']:
        print(f"- {tool['name']}: {tool['description']}")
    
    # Example search
    print("\nExample search:")
    search_result = client.call_tool("webSearchPrime", {
        "search_query": "MCP Model Context Protocol tutorial",
        "content_size": "medium",
        "location": "us"
    })
    
    if search_result and 'result' in search_result:
        result = search_result['result']
        if 'content' in result:
            for content_item in result['content']:
                print(content_item['text'])
    else:
        print("Search completed (note: may require additional API key for actual results)")