import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {createReleaseTool, CreateReleaseToolParams} from './createReleaseTool.js'
import {editReleaseTool, EditReleaseToolParams} from './editReleaseTool.js'
import {scheduleReleaseTool, ScheduleReleaseToolParams} from './scheduleReleaseTool.js'
import {listReleasesTool, ListReleasesToolParams} from './listReleases.js'
import { publishReleaseTool, PublishReleaseToolParams } from './publishReleaseTool.js'
import { archiveReleaseTool, ArchiveReleaseToolParams } from './archiveReleaseTool.js'
import { UnachiveReleaseToolParams, unarchiveReleaseTool } from './unarchiveReleaseTool.js'
import { unscheduleReleaseTool, UnscheduleReleaseToolParams } from './unscheduleReleaseTool.js'
import { deleteReleaseTool, DeleteReleaseToolParams } from './deleteReleaseTool.js'

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
    'publish_release_action',
    'Publish a release',
    PublishReleaseToolParams.shape,
    publishReleaseTool,
  )

  server.tool(
    'archive_release_action',
    'Archive a release',
    ArchiveReleaseToolParams.shape,
    archiveReleaseTool,
  )

  server.tool(
    'unarchive_release_action',
    'Unarchive a release',
    UnachiveReleaseToolParams.shape,
    unarchiveReleaseTool,
  )

  server.tool(
    'unschedule_release_action',
    'Unschedule a release',
    UnscheduleReleaseToolParams.shape,
    unscheduleReleaseTool,
  )

  server.tool(
    'delete_release_action',
    'Delete a release',
    DeleteReleaseToolParams.shape,
    deleteReleaseTool,
  )
}
