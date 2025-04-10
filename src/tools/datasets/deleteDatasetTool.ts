import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

export const DeleteDatasetToolParams = z.object({
  name: z.string().describe('The name of the dataset to delete'),
})

type Params = z.infer<typeof DeleteDatasetToolParams>

async function tool(args: Params) {
  // Only lowercase letters and numbers are allowed
  const datasetToDelete = args.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  await sanityClient.datasets.delete(datasetToDelete)

  return createSuccessResponse('Dataset deleted successfully', {
    deletedDataset: datasetToDelete,
  })
}

export const deleteDatasetTool = withErrorHandling(tool, 'Error deleting dataset')
