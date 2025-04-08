import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const ListDatasetsToolParams = z.object({})

type Params = z.infer<typeof ListDatasetsToolParams>

export async function listDatasetsTool(_params: Params) {
  try {
    const datasets = await sanityClient.datasets.list()

    if (datasets.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No datasets found',
          },
        ],
      }
    }

    // Filter out datasets with the 'comments' profile
    const filteredDatasets = datasets.filter((dataset) => dataset.datasetProfile !== 'comments')

    if (filteredDatasets.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No datasets found',
          },
        ],
      }
    }

    const flattenedDatasets = filteredDatasets.reduce<
      Record<string, {name: string; aclMode: string; createdAt: string}>
    >((acc, dataset) => {
      acc[dataset.name] = {
        name: dataset.name,
        aclMode: dataset.aclMode,
        createdAt: dataset.createdAt,
      }
      return acc
    }, {})

    const message = formatResponse('Here are the datasets', {datasets: flattenedDatasets})

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
          text: `Error fetching datasets: ${error}`,
        },
      ],
    }
  }
}
