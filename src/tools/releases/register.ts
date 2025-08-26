import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {createReleaseTool, CreateReleaseToolParams} from './createReleaseTool.js'
import {editReleaseTool, EditReleaseToolParams} from './editReleaseTool.js'
import {scheduleReleaseTool, ScheduleReleaseToolParams} from './scheduleReleaseTool.js'
import {listReleasesTool, ListReleasesToolParams} from './listReleases.js'
import {publishReleaseTool, PublishReleaseToolParams} from './publishReleaseTool.js'
import {archiveReleaseTool, ArchiveReleaseToolParams} from './archiveReleaseTool.js'
import {unarchiveReleaseTool, UnarchiveReleaseToolParams} from './unarchiveReleaseTool.js'
import {unscheduleReleaseTool, UnscheduleReleaseToolParams} from './unscheduleReleaseTool.js'
import {deleteReleaseTool, DeleteReleaseToolParams} from './deleteReleaseTool.js'
import {_BaseToolSchemaType} from '../../utils/tools.js'

export function registerReleasesTools(server: McpServer, baseSchema: _BaseToolSchemaType) {
  server.tool(
    'list_releases',
    'List content releases in Sanity, optionally filtered by state (active, scheduled, etc)',
    baseSchema.extend(ListReleasesToolParams.shape).shape,
    listReleasesTool,
  )

  server.tool(
    'create_release',
    'Create a new content release in Sanity with an automatically generated ID',
    baseSchema.extend(CreateReleaseToolParams.shape).shape,
    createReleaseTool,
  )

  server.tool(
    'edit_release',
    'Update metadata for an existing content release',
    baseSchema.extend(EditReleaseToolParams.shape).shape,
    editReleaseTool,
  )

  server.tool(
    'schedule_release',
    'Schedule a content release to be published at a specific time',
    baseSchema.extend(ScheduleReleaseToolParams.shape).shape,
    scheduleReleaseTool,
  )

  server.tool(
    'publish_release',
    'Publish a release immediately',
    baseSchema.extend(PublishReleaseToolParams.shape).shape,
    publishReleaseTool,
  )

  server.tool(
    'archive_release',
    'Archive a release that is no longer active',
    baseSchema.extend(ArchiveReleaseToolParams.shape).shape,
    archiveReleaseTool,
  )

  server.tool(
    'unarchive_release',
    'Restore an archived release',
    baseSchema.extend(UnarchiveReleaseToolParams.shape).shape,
    unarchiveReleaseTool,
  )

  server.tool(
    'unschedule_release',
    'Remove a previously set schedule from a release',
    baseSchema.extend(UnscheduleReleaseToolParams.shape).shape,
    unscheduleReleaseTool,
  )

  server.tool(
    'delete_release',
    'Delete a release',
    baseSchema.extend(DeleteReleaseToolParams.shape).shape,
    deleteReleaseTool,
  )
}
