#!/usr/bin/env node
import {Server} from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import {zodToJsonSchema} from 'zod-to-json-schema'

import * as toolsRegistry from './tools/index.js'
import logger from './utils/logger.js'
import {sanityTransport} from './utils/mcpTransport.js'

// Create MCP server
const server = new Server(
  {
    name: 'Sanity MCP Server',
    version: '0.1.1'
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Handle tool listing request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = toolsRegistry.getToolDefinitions()
  logger.info(`Responding with ${tools.length} tools`)

  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.parameters),
    }))
  }
})

/**
 * Format the tool execution result according to MCP specification
 * @param result - The result from tool execution
 * @returns Properly formatted result
 */
function formatToolResult(result: unknown): string {
  // Ensure we have valid content for the response
  let textContent: string
  
  // Special handling for different result types
  if (typeof result === 'string') {
    textContent = result
  } else if (result === null || result === undefined) {
    textContent = ''
  } else {
    // For objects and arrays, format as JSON
    try {
      textContent = JSON.stringify(result, null, 2)
    } catch (error) {
      textContent = String(result)
    }
  }
  
  return textContent
}

// Handle tool execution request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error('Arguments are required')
    }

    logger.info(`Executing tool: ${request.params.name}`)
    const result = await toolsRegistry.executeTool(
      request.params.name,
      request.params.arguments
    )

    // Format result according to MCP specification
    const textContent = formatToolResult(result)
    
    return {
      content: textContent
    }
  } catch (error: unknown) {
    // Log errors to stderr to avoid interfering with MCP protocol
    logger.error(`Error executing tool ${request.params.name}: ${error instanceof Error ? error.message : String(error)}`)
    
    // Return a structured error message
    return {
      content: JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
})

logger.info('Starting Sanity MCP Server...')

// Use our enhanced transport that ensures proper stdout/stderr handling
server.connect(sanityTransport)
  .then(() => {
    logger.info('Sanity MCP Server connected successfully!')
  })
  .catch((error) => {
    logger.error('Failed to connect server:', error)
    process.exit(1)
  })

// Specific stdout data debugging help
process.stdout.on('error', (err) => {
  logger.error('Error writing to stdout:', err)
})

// Make sure SIGINT and SIGTERM are handled properly
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down server...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down server...')
  process.exit(0)
})
