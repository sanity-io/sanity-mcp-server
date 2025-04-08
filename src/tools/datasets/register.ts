import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getDatasetsTool} from './getDatasetsTool.js'
import {createDatasetParams, deleteDatasetParams, updateDatasetParams} from './schemas.js'
import {createDatasetTool} from './createDatasetTool.js'
import {updateDatasetTool} from './updateDatasetTool.js'
import {deleteDatasetTool} from './deleteDatasetTool.js'

export function registerDatasetsTools(server: McpServer) {
  server.tool(
    'get_datasets',
    'Lists all available datasets in your Sanity project, showing their names, creation dates, and access settings',
    {},
    getDatasetsTool,
  )
  server.tool(
    'create_dataset',
    'Creates a new dataset in your Sanity project with specified name and optional access control settings (public/private)',
    createDatasetParams,
    createDatasetTool,
  )
  server.tool(
    'delete_dataset',
    'Permanently removes a dataset and all its content from your Sanity project - use with caution',
    deleteDatasetParams,
    deleteDatasetTool,
  )
  server.tool(
    'update_dataset',
    "Modifies an existing dataset's settings, allowing you to change its name or access control mode (public/private)",
    updateDatasetParams,
    updateDatasetTool,
  )
}
