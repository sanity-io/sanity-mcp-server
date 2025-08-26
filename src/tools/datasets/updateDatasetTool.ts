import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'

export const UpdateDatasetToolParams = z.object({
  aclMode: z.enum(['private', 'public']).optional().describe('The ACL mode for the dataset'),
})

type Params = z.infer<typeof UpdateDatasetToolParams>

async function _tool(args: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(args, extra?.authInfo?.token)

  // we rely on getting the dataset name through either passed param, or as a fallback in createToolClient (via ENV vars, for example), so we have to read it back out like this
  const datasetName = client.config().dataset 

  if (!datasetName) {
    throw new Error('Dataset name to update is required')
  }

  const datasets = await client.datasets.list()
  const datasetExists = datasets.some((dataset) => dataset.name === datasetName)
  if (!datasetExists) {
    throw new Error(`Dataset '${datasetName}' not found. The name has to be exact.`)
  }

  const newDataset = await client.datasets.edit(datasetName, {
    aclMode: args.aclMode,
  })

  return createSuccessResponse('Dataset updated successfully', {newDataset})
}

export const updateDatasetTool = withErrorHandling(_tool, 'Error updating dataset')
