import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

export const ListDatasetsToolParams = z.object({})

type Params = z.infer<typeof ListDatasetsToolParams>

async function tool(_params?: Params) {
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

  const flattenedDatasets: Record<string, object> = {}
  for (const dataset of filteredDatasets) {
    flattenedDatasets[dataset.name] = {
      name: dataset.name,
      aclMode: dataset.aclMode,
      createdAt: dataset.createdAt,
    }
  }

  return createSuccessResponse('Here are the datasets', {datasets: flattenedDatasets})
}

export const listDatasetsTool = withErrorHandling(tool, 'Error fetching datasets')
