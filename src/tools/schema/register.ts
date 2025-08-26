import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getSchemaTool, GetSchemaToolParams} from './getSchemaTool.js'
import {listWorkspaceSchemasTool, ListWorkspaceSchemasTool} from './listWorkspaceSchemasTool.js'
import { _BaseToolSchemaType } from '../../utils/tools.js'

export function registerSchemaTools(server: McpServer, baseSchema: _BaseToolSchemaType) {
  server.tool(
    'get_schema',
    'Get the full schema of the current Sanity workspace',
    baseSchema.extend(GetSchemaToolParams.shape).shape,
    getSchemaTool,
  )

  server.tool(
    'list_workspace_schemas',
    'Get a list of all available workspace schema names',
    baseSchema.extend(ListWorkspaceSchemasTool.shape).shape,
    listWorkspaceSchemasTool,
  )
}
