import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getSanityConfigTool} from './getSanityConfigTool.js'

export function registerConfigTools(server: McpServer) {
  server.tool(
    'get_sanity_config',
    'Get current Sanity configuration information from environment variables. Covers projectId, dataset, apiVersion, useCdn and perspective',
    {},
    getSanityConfigTool,
  )
}
