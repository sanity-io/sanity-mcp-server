import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getProjectsTool} from './getProjectsTool.js'
import {GetProjectParams} from './schema.js'
import {getStudiosTool} from './getStudiosTool.js'

export function registerProjectsTools(server: McpServer) {
  server.tool(
    'get_projects',
    'Get information about projects you have access to',
    {},
    getProjectsTool,
  )
  server.tool(
    'get_studios',
    'List all studio hosts for a specific project',
    GetProjectParams,
    getStudiosTool,
  )
}
