import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const UpdateDatasetToolParams = z.object({
  name: z
    .string()
    .describe('The name of the dataset (will be automatically formatted to match requirements)'),
  aclMode: z.enum(['private', 'public']).optional().describe('The ACL mode for the dataset'),
})

type Params = z.infer<typeof UpdateDatasetToolParams>

export async function updateDatasetTool(args: Params) {
  try {
    const datasetName = args.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const newDataset = await sanityClient.datasets.edit(datasetName, {
      aclMode: args.aclMode,
    })
    const message = formatResponse('Dataset updated successfully', {newDataset})

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
        },
      ],
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error updating dataset: ${errorMessage}`,
        },
      ],
    }
  }
}
