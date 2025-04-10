import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

export const CreateDatasetToolParams = z.object({
  name: z
    .string()
    .describe('The name of the dataset (will be automatically formatted to match requirements)'),
  aclMode: z.enum(['private', 'public']).optional().describe('The ACL mode for the dataset'),
})

type Params = z.infer<typeof CreateDatasetToolParams>

async function tool(args: Params) {
  // Only lowercase letters and numbers are allowed
  const datasetName = args.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const newDataset = await sanityClient.datasets.create(datasetName, {
    aclMode: args.aclMode,
  })

  return createSuccessResponse('Dataset created successfully', {newDataset})
}

export const createDatasetTool = withErrorHandling(tool, 'Error creating dataset')
