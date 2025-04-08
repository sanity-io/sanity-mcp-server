import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getSchemaOverviewTool} from './getSchemaOverviewTool.js'
import {getTypeSchemaTool} from './getTypeSchemaTool.js'
import {GetSchemaParams} from './schema.js'

export function registerSchemaTools(server: McpServer) {
  server.tool(
    'get_schema_overview',
    'Get a concise overview of the schema types',
    {},
    getSchemaOverviewTool,
  )
  server.tool(
    'get_type_schema_details',
    'Get detailed schema details for a specific type, including all fields and their descriptions',
    GetSchemaParams,
    getTypeSchemaTool,
  )
}
