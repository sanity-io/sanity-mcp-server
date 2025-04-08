import {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'
import {sanityClient} from '../../config/sanity.js'
import {UpdateDatasetParams} from './schemas.js'

export async function updateDatasetTool(args: UpdateDatasetParams, extra: RequestHandlerExtra) {
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
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error updating dataset: ${error}`,
        },
      ],
    }
  }
}
