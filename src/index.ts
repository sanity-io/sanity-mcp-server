#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

import config from './config/config.js';
import * as toolsRegistry from './tools/index.js';

// Create MCP server
const server = new Server(
  {
    name: "Sanity MCP Server",
    version: "0.1.1"
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = toolsRegistry.getToolDefinitions();
  
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

    const result = await toolsRegistry.executeTool(
      request.params.name, 
      request.params.arguments
    );

    return {
      result
    };
  } catch (error: unknown) {
    console.error("Error executing tool:", error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// Start listening on stdio
const transport = new StdioServerTransport();
// Use the correct method to connect the server to the transport
server.connect(transport).catch(error => {
  console.error("Failed to connect server:", error);
  process.exit(1);
});
