import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, ToolCallExtra} from '../../utils/tools.js'

export const DeleteDatasetToolParams = z.object({
  resource: z.object({
    projectId: z.string().describe('The Sanity project id the dataset belongs to'),
  }),
  datasetName: z.string().describe('The name of the dataset to delete'),
})

type Params = z.infer<typeof DeleteDatasetToolParams>

async function _tool(args: Params, extra?: ToolCallExtra) {
  const client = createToolClient({
    resource: {
      projectId: args.resource.projectId,
      dataset: args.datasetName,
    }
  }, extra?.authInfo?.token)

  const datasets = await client.datasets.list()
  const datasetExists = datasets.some((dataset) => dataset.name === args.datasetName)
  if (!datasetExists) {
    throw new Error(`Dataset '${args.datasetName}' not found. The name has to be exact.`)
  }

  await client.datasets.delete(args.datasetName)

  return createSuccessResponse('Dataset deleted successfully', {
    deletedDataset: args.datasetName,
  })
}

export const deleteDatasetTool = withErrorHandling(_tool, 'Error deleting dataset')
