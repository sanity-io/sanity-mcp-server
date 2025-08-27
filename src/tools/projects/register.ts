import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {listProjectsTool} from './listProjectsTool.js'
import {getProjectStudiosTool, GetProjectStudiosToolParams} from './getProjectStudiosTool.js'

export function registerProjectsTools(server: McpServer) {
  server.tool(
    'list_projects',
    'Lists all Sanity projects associated with your account',
    listProjectsTool,
  )

  server.tool(
    'get_project_studios',
    'Retrieves all studio applications linked to a specific Sanity project',
    GetProjectStudiosToolParams.shape,
    getProjectStudiosTool,
  )
}
