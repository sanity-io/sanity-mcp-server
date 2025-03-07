#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create MCP server using the high-level API
const server = new McpServer({
  name: "Echo MCP Server",
  version: "1.0.0"
});

// Define the echo tool using the high-level API
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }]
  })
);

console.log("Starting Echo MCP Server...");
const transport = new StdioServerTransport();
server.connect(transport).catch(error => {
  console.error("Failed to connect server:", error);
  process.exit(1);
}); 