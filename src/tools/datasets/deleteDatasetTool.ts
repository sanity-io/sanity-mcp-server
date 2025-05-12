import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const DeleteDatasetToolParams = z
  .object({
    name: z.string().describe('The name of the dataset to delete'),
  })
  .merge(BaseToolSchema)

type Params = z.infer<typeof DeleteDatasetToolParams>

async function tool(args: Params) {
  const client = createToolClient(args)
  // Only lowercase letters and numbers are allowed
  const datasetToDelete = args.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  await client.datasets.delete(datasetToDelete)

  return createSuccessResponse('Dataset deleted successfully', {
    deletedDataset: datasetToDelete,
  })
}

export const deleteDatasetTool = withErrorHandling(tool, 'Error deleting dataset')
