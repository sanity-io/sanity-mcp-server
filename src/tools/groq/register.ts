import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getGroqSpecificationTool, GetGroqSpecificationToolParams} from './getGroqSpecification.js'

export function registerGroqTools(server: McpServer) {
  server.tool(
    'get_groq_specification',
    'Get the GROQ language specification summary',
    GetGroqSpecificationToolParams.shape,
    getGroqSpecificationTool,
  )
}
