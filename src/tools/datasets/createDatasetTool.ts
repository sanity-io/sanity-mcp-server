import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const CreateDatasetToolParams = z.object({
  name: z
    .string()
    .describe('The name of the dataset (will be automatically formatted to match requirements)'),
  aclMode: z.enum(['private', 'public']).optional().describe('The ACL mode for the dataset'),
})

type Params = z.infer<typeof CreateDatasetToolParams>

export async function createDatasetTool(args: Params) {
  try {
    // Only lowercase letters and numbers are allowed
    const datasetName = args.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const newDataset = await sanityClient.datasets.create(datasetName, {
      aclMode: args.aclMode,
    })
    const message = formatResponse('Dataset created successfully', {newDataset})

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
        },
      ],
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error creating dataset: ${error}`,
        },
      ],
    }
  }
}
