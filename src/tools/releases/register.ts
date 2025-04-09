import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {releaseActionsTool, ReleaseActionsToolParams} from './releaseActionsTool.js'
import {createReleaseTool, CreateReleaseToolParams} from './createReleaseTool.js'
import {editReleaseTool, EditReleaseToolParams} from './editReleaseTool.js'
import {scheduleReleaseTool, ScheduleReleaseToolParams} from './scheduleReleaseTool.js'
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
    'edit_release',
    'Update metadata for an existing content release',
    EditReleaseToolParams.shape,
    editReleaseTool,
  )

  server.tool(
    'schedule_release',
    'Schedule a content release to be published at a specific time',
    ScheduleReleaseToolParams.shape,
    scheduleReleaseTool,
  )

  server.tool(
    'release_action',
    'Perform basic actions on existing content releases (publish, archive, unschedule, delete)',
    ReleaseActionsToolParams.shape,
    releaseActionsTool,
  )
}
