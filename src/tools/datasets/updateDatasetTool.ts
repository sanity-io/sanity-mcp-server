import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

export const UpdateDatasetToolParams = z.object({
  name: z
    .string()
    .describe('The name of the dataset (will be automatically formatted to match requirements)'),
  aclMode: z.enum(['private', 'public']).optional().describe('The ACL mode for the dataset'),
})

type Params = z.infer<typeof UpdateDatasetToolParams>

async function tool(args: Params) {
  const datasetName = args.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const newDataset = await sanityClient.datasets.edit(datasetName, {
    aclMode: args.aclMode,
  })

  return createSuccessResponse('Dataset updated successfully', {newDataset})
}

export const updateDatasetTool = withErrorHandling(tool, 'Error updating dataset')
