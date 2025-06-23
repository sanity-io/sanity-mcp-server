import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const UpdateDatasetToolParams = BaseToolSchema.extend({
  name: z
    .string()
    .describe('The name of the dataset (will be automatically formatted to match requirements)'),
  aclMode: z.enum(['private', 'public']).optional().describe('The ACL mode for the dataset'),
})

type Params = z.infer<typeof UpdateDatasetToolParams>

async function _tool(args: Params) {
  const client = createToolClient(args)
  const datasets = await client.datasets.list()
  const datasetExists = datasets.some((dataset) => dataset.name === args.name)
  if (!datasetExists) {
    throw new Error(`Dataset '${args.name}' not found. The name has to be exact.`)
  }

  const newDataset = await client.datasets.edit(args.name, {
    aclMode: args.aclMode,
  })

  return createSuccessResponse('Dataset updated successfully', {newDataset})
}

export const updateDatasetTool = withErrorHandling(_tool, 'Error updating dataset')
