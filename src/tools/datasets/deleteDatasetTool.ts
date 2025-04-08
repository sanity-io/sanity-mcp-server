import {sanityClient} from '../../config/sanity.js'
import {DeleteDatasetParams} from './schemas.js'

export async function deleteDatasetTool(args: DeleteDatasetParams) {
  try {
    const deletedDataset = await sanityClient.datasets.delete(args.dataset)

    const text = JSON.stringify(
      {
        operation: 'deletedDataset',
        success: deletedDataset,
      },
      null,
      2,
    )

    return {
      content: [
        {
          type: 'text' as const,
          text: `Dataset deleted: ${text}`,
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
