import {sanityClient} from '../../config/sanity.js'
import {CreateDatasetParams} from './schemas.js'

export async function createDatasetTool(args: CreateDatasetParams) {
  try {
    const newDataset = await sanityClient.datasets.create(args.name, {
      aclMode: args.aclMode,
    })

    const text = JSON.stringify(
      {
        operation: 'create',
        dataset: newDataset,
      },
      null,
      2,
    )

    return {
      content: [
        {
          type: 'text' as const,
          text: `Dataset created: ${text}`,
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
