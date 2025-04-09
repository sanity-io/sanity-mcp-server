import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getSanityConfigTool, GetSanityConfigToolParams} from './getSanityConfigTool.js'
import {getInitialContextTool} from './getInitialContextTool.js'

export function registerContextTools(server: McpServer) {
  server.tool(
    'get_initial_context',
    'IMPORTANT: This tool must be called before using any other tools. It will get initial context and usage instructions for this MCP server. ',
    {},
    getInitialContextTool,
  )

  server.tool(
    'get_sanity_config',
    'Get current Sanity configuration (projectId, dataset, API settings)',
    GetSanityConfigToolParams.shape,
    getSanityConfigTool,
  )
}
