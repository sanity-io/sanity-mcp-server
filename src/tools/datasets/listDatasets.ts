import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'

export const ListDatasetsToolParams = z.object({
  resource: z.object({
    projectId: z.string().describe('The ID of the project to list datasets for')
  }),
})

type Params = z.infer<typeof ListDatasetsToolParams>

async function _tool(params: Params, extra?: ToolCallExtra) {
  const client = createToolClient({
    resource: {
      projectId: params.resource.projectId,
      dataset: 'dummy' // not needed for this API call, but required by client
    }
  }, extra?.authInfo?.token)
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

export const listDatasetsTool = withErrorHandling(_tool, 'Error fetching datasets')
