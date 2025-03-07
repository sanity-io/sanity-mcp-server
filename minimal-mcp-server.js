#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create a minimal MCP server
const server = new McpServer({
  name: "Minimal MCP Server",
  version: "1.0.0"
});

// Define a simple echo tool
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }]
  })
);

// Define a simple greeting tool
server.tool(
  "greeting",
  { name: z.string() },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}! Welcome to the MCP server.` }]
  })
);

// Define a simple context tool
server.tool(
  "getInitialContext",
  { },
  async () => ({
    content: [{ 
      type: "text", 
      text: JSON.stringify({
        message: "Welcome to the Minimal MCP Server!",
        instructions: "You can use the echo and greeting tools to test functionality.",
        note: "This is a minimal implementation for testing purposes."
      }, null, 2)
    }]
  })
);

console.log("Starting Minimal MCP Server...");
const transport = new StdioServerTransport();
server.connect(transport).catch(error => {
  console.error("Failed to connect server:", error);
  process.exit(1);
}); 