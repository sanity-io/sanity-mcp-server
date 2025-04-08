import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const DeleteDatasetToolParams = z.object({
  name: z.string().describe('The name of the dataset to delete'),
})

type Params = z.infer<typeof DeleteDatasetToolParams>

export async function deleteDatasetTool(args: Params) {
  try {
    // Only lowercase letters and numbers are allowed
    const datasetToDelete = args.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    await sanityClient.datasets.delete(datasetToDelete)

    const message = formatResponse('Dataset deleted successfully', {
      deletedDataset: datasetToDelete,
    })

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
          text: `Error deleting dataset: ${error}`,
        },
      ],
    }
  }
}
