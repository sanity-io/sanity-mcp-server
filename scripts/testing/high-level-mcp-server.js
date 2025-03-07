#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Parse command line arguments
function parseCommandLineArgs() {
  const args = {};
  
  for (const arg of process.argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key && value) {
        // Convert kebab-case to camelCase
        const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        args[camelKey] = value;
      }
    }
  }
  
  return args;
}

const args = parseCommandLineArgs();

// Create an MCP server
const server = new McpServer({
  name: "Sanity High-Level MCP Server",
  version: "1.0.0"
});

// Define a context tool that provides information about the connection
server.tool(
  "getInitialContext",
  {},
  async () => ({
    content: [{ 
      type: "text", 
      text: JSON.stringify({
        message: "Welcome to the Sanity High-Level MCP Server!",
        projectId: args.sanityProjectId || process.env.SANITY_PROJECT_ID,
        dataset: args.sanityDataset || process.env.SANITY_DATASET || "production",
        apiVersion: args.sanityApiVersion || process.env.SANITY_API_VERSION || "2024-05-23",
        note: "This is a simplified implementation that shows connection information."
      }, null, 2)
    }]
  })
);

// Define an echo tool for testing
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }]
  })
);

// Define a simple GROQ query tool
server.tool(
  "executeGroq",
  { 
    query: z.string().describe("GROQ query to execute"),
    params: z.optional(z.record(z.any())).describe("Optional parameters for the GROQ query")
  },
  async ({ query, params }) => {
    // In a real implementation, this would connect to Sanity and run the query
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          query,
          params,
          result: "This is a simulated GROQ result. In a real implementation, this would return actual data.",
          projectId: args.sanityProjectId || process.env.SANITY_PROJECT_ID,
          dataset: args.sanityDataset || process.env.SANITY_DATASET || "production"
        }, null, 2)
      }]
    };
  })
);

console.log("Starting Sanity High-Level MCP Server...");
const transport = new StdioServerTransport();
server.connect(transport).catch(error => {
  console.error("Failed to connect server:", error);
  process.exit(1);
}); 