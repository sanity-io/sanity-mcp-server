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
import logger from './utils/logger.js';

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

    logger.info(`Executing tool: ${request.params.name} with args: ${JSON.stringify(request.params.arguments)}`);
    const result = await toolsRegistry.executeTool(
      request.params.name, 
      request.params.arguments
    );

    // Format result according to MCP specification
    // Ensure we have valid content for the response
    let textContent;
    try {
      // Special handling for different result types
      if (typeof result === 'string') {
        textContent = result;
      } else if (result === null || result === undefined) {
        textContent = `${result}`;
      } else if (typeof result === 'object') {
        // Try to stringify with spaces for readability
        textContent = JSON.stringify(result, null, 2);
      } else {
        // For other primitive types
        textContent = String(result);
      }
    } catch (e) {
      logger.error("Error serializing response:", e);
      textContent = `[Error serializing result: ${e instanceof Error ? e.message : String(e)}]`;
    }
    
    // Verify the text content is properly set
    if (textContent === undefined || textContent === null) {
      textContent = "[No result data]";
    }
    
    const response = {
      content: [
        {
          type: "text",
          text: textContent
        }
      ]
    };
    
    logger.info(`Tool response prepared`);
    return response;
  } catch (error: unknown) {
    logger.error("Error executing tool:", error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// Start listening on stdio
const transport = new StdioServerTransport();

logger.info("Starting Sanity MCP Server...");
// Use the correct method to connect the server to the transport
server.connect(transport)
  .then(() => {
    logger.info("Sanity MCP Server connected successfully!");
  })
  .catch(error => {
    logger.error("Failed to connect server:", error);
    process.exit(1);
  });
