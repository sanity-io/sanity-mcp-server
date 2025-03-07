#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create MCP server with extended metadata
const server = new McpServer({
  name: "Minimal MCP Server",
  version: "1.0.0",
  metadata: {
    invocationPattern: "mcp__serverName__toolName",
    standardPattern: true,
    supportedPatterns: ["mcp__serverName__toolName", "mcp__toolName"],
    examples: {
      echo: {
        standard: "mcp__minimal__echo({ message: \"Hello World\" })",
        cursor: "mcp__echo({ message: \"Hello World\" })"
      }
    }
  }
});

// Define a simple echo tool with detailed logging
server.tool(
  "echo",
  { message: z.string() },
  async (params) => {
    console.log(`Echo tool called with message: ${params.message}`);
    
    // Format exactly as shown in MCP documentation examples
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${params.message}`
        }
      ]
    };
  }
);

// Define a simple greeting tool
server.tool(
  "greeting",
  { name: z.string() },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}! Welcome to the MCP server.` }]
  })
);

// Define a simple getInitialContext tool
server.tool(
  "getInitialContext",
  { },
  async () => {
    console.log("getInitialContext tool called");
    
    const contextData = {
      message: "Welcome to the Minimal MCP Server!",
      instructions: "You can use the echo tool to test functionality.",
      note: "This is a minimal implementation for testing purposes."
    };
    
    const response = {
      content: [
        { 
          type: "text", 
          text: JSON.stringify(contextData, null, 2)
        }
      ]
    };
    
    console.log(`Returning response: ${JSON.stringify(response)}`);
    return response;
  }
);

console.log("Starting Minimal MCP Server...");
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => {
    console.log("Server connected successfully!");
  })
  .catch(error => {
    console.error("Failed to connect server:", error);
    process.exit(1);
  }); 