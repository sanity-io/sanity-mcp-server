import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {listDatasetsTool, ListDatasetsToolParams} from './listDatasets.js'
import {createDatasetTool, CreateDatasetToolParams} from './createDatasetTool.js'
import {updateDatasetTool, UpdateDatasetToolParams} from './updateDatasetTool.js'
import { _BaseToolSchemaType } from '../../utils/tools.js'
// import {deleteDatasetTool, DeleteDatasetToolParams} from './deleteDatasetTool.js'

export function registerDatasetsTools(server: McpServer, baseSchema: _BaseToolSchemaType) {
  server.tool(
    'list_datasets',
    'Lists all datasets in your Sanity project',
    ListDatasetsToolParams.shape,
    listDatasetsTool,
  )
  server.tool(
    'create_dataset',
    'Creates a new dataset with specified name and access settings',
    CreateDatasetToolParams.shape,
    createDatasetTool,
  )
  server.tool(
    'update_dataset',
    "Modifies a dataset's name or access control settings",
    baseSchema.extend(UpdateDatasetToolParams.shape).shape,
    updateDatasetTool,
  )
  // server.tool(
  //   'delete_dataset',
  //   'Permanently removes a dataset and all its content - use with caution',
  //   DeleteDatasetToolParams.shape,
  //   deleteDatasetTool,
  // )
}
