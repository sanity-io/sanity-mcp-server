import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getSchemaTool, GetSchemaToolParams} from './getSchemaTool.js'
import {listSchemaIdsTool, ListSchemaIdsToolParams} from './listSchemaIdsTool.js'

export function registerSchemaTools(server: McpServer) {
  server.tool(
    'get_type_schema_details',
    'Get the full schema of the current Sanity environment',
    GetSchemaToolParams.shape,
    getSchemaTool,
  )

  server.tool(
    'get_available_schema_ids',
    'Get a list of all available schema IDs',
    ListSchemaIdsToolParams.shape,
    listSchemaIdsTool,
  )
}
