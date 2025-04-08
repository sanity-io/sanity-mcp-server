import {sanityClient} from '../../config/sanity.js'
import {UpdateDatasetParams} from './schemas.js'

export async function updateDatasetTool(args: UpdateDatasetParams) {
  try {
    const updatedDataset = await sanityClient.datasets.edit(args.name, {
      aclMode: args.aclMode,
    })

    const text = JSON.stringify(
      {
        operation: 'update',
        dataset: updatedDataset,
      },
      null,
      2,
    )

    return {
      content: [
        {
          type: 'text' as const,
          text: `Dataset updated: ${text}`,
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
