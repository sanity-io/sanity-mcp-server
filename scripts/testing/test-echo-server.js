#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Create a logger that uses stderr instead of stdout
const log = {
  info: (...args) => console.error('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};

// Create MCP server
const server = new Server(
  {
    name: "Echo MCP Server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
    }
  }
);

// Handle tool listing request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log.info("Received ListToolsRequest");
  
  return {
    tools: [{
      name: "echo",
      description: "Echoes back any message you send",
      inputSchema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The message to echo back"
          }
        },
        required: ["message"]
      }
    }]
  };
});

// Handle tool execution request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  log.info(`Received CallToolRequest: ${JSON.stringify(request)}`);
  
  try {
    // Check for required args
    if (!request.params.arguments || !request.params.arguments.message) {
      throw new Error("Message argument is required");
    }

    // For echo tool
    if (request.params.name === "echo") {
      const message = request.params.arguments.message;
      log.info(`Echo tool called with message: ${message}`);
      
      // Explicit Claude format
      const response = {
        content: [
          {
            type: "text",
            text: `Echo: ${message}`
          }
        ]
      };
      
      log.info(`Returning response: ${JSON.stringify(response)}`);
      return response;
    } else {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    log.error("Error executing tool:", error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

log.info("Starting Echo MCP Server...");
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  log.info("Server connected successfully!");
}).catch(error => {
  log.error("Failed to connect server:", error);
  process.exit(1);
}); 