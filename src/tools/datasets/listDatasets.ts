import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const ListDatasetsToolParams = z.object({}).merge(BaseToolSchema)

type Params = z.infer<typeof ListDatasetsToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const datasets = await client.datasets.list()

  // Filter out datasets with the 'comments' profile
  const filteredDatasets = datasets?.filter((dataset) => dataset.datasetProfile !== 'comments')
  if (filteredDatasets.length === 0) {
    throw new Error('No datasets found')
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
