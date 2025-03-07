#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

import config from './config/config.js';
import * as toolsRegistry from './tools/index.js';
import logger from './utils/logger.js';
import { sanityTransport } from './utils/mcpTransport.js';

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
  logger.info(`Responding with ${tools.length} tools`);
  
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

    logger.info(`Executing tool: ${request.params.name}`);
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

logger.info("Starting Sanity MCP Server...");

// Use our enhanced transport that ensures proper stdout/stderr handling
server.connect(sanityTransport)
  .then(() => {
    logger.info("Sanity MCP Server connected successfully!");
  })
  .catch(error => {
    logger.error("Failed to connect server:", error);
    process.exit(1);
  });

// Specific stdout data debugging help
process.stdout.on('error', (err) => {
  logger.error('Error writing to stdout:', err);
});

// Make sure SIGINT and SIGTERM are handled properly
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down server...');
  process.exit(0);
});
