import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getSanityConfigTool, GetSanityConfigToolParams} from './getSanityConfigTool.js'

export function registerConfigTools(server: McpServer) {
  server.tool(
    'get_sanity_config',
    'Get current Sanity configuration (projectId, dataset, API settings)',
    GetSanityConfigToolParams.shape,
    getSanityConfigTool,
  )
}
