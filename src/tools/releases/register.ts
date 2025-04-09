import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {releaseActionsTool, ReleaseActionsToolParams} from './releaseActionsTool.js'
import {createReleaseTool, CreateReleaseToolParams} from './createReleaseTool.js'
import {listReleasesTool, ListReleasesToolParams} from './listReleases.js'

export function registerReleasesTools(server: McpServer) {
  server.tool(
    'list_releases',
    'List content releases in Sanity, optionally filtered by state (active, scheduled, etc)',
    ListReleasesToolParams.shape,
    listReleasesTool,
  )

  server.tool(
    'create_release',
    'Create a new content release in Sanity with an automatically generated ID',
    CreateReleaseToolParams.shape,
    createReleaseTool,
  )

  server.tool(
    'release_action',
    'Perform actions on existing content releases (publish, archive, schedule, etc)',
    ReleaseActionsToolParams.shape,
    releaseActionsTool,
  )
}
