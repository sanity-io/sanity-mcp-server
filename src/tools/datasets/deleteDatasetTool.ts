import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const DeleteDatasetToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the dataset to delete'),
})

type Params = z.infer<typeof DeleteDatasetToolParams>

async function tool(args: Params) {
  const client = createToolClient(args)

  const datasets = await client.datasets.list()
  const datasetExists = datasets.some((dataset) => dataset.name === args.name)
  if (!datasetExists) {
    throw new Error(`Dataset '${args.name}' not found. The name has to be exact.`)
  }

  await client.datasets.delete(args.name)

  return createSuccessResponse('Dataset deleted successfully', {
    deletedDataset: args.name,
  })
}

export const deleteDatasetTool = withErrorHandling(tool, 'Error deleting dataset')
