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

async function tool(args: Params) {
  const client = createToolClient(args)
  const datasetName = args.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const newDataset = await client.datasets.edit(datasetName, {
    aclMode: args.aclMode,
  })

  return createSuccessResponse('Dataset updated successfully', {newDataset})
}

export const updateDatasetTool = withErrorHandling(tool, 'Error updating dataset')
