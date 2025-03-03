#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

import config from './config/config.ts';
import * as toolsController from './controllers/tools.ts';

// Create MCP server
const server = new Server(
  {
    name: "Sanity MCP Server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = toolsController.getToolDefinitions();
  
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.parameters),
    }))
  };
});

// Handle tool execution request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    const result = await toolsController.executeTool(
      request.params.name, 
      request.params.arguments
    );

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    console.error(`Error executing tool ${request.params.name}:`, error);
    throw error;
  }
});

// Run the server
async function runServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sanity MCP Server running on stdio");
}

runServer().catch((error: Error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
