import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {executeGroqQueryTool} from './executeGroqQuery.js'
import {getGroqSpecificationTool} from './getGroqSpecification.js'
import {executeGroqQueryParams} from './schemas.js'

/**
 * Register all GROQ-related tools with the MCP server
 */
export function registerGroqTools(server: McpServer) {
  server.tool(
    'get_groq_specification',
    'Get the GROQ language specification',
    {},
    getGroqSpecificationTool,
  )

  server.tool(
    'execute_groq_query',
    'Execute a GROQ query against the Sanity dataset',
    executeGroqQueryParams,
    executeGroqQueryTool,
  )
}
