import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {EmbeddingsIndex} from '../../types/sanity.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'
import {pluralize} from '../../utils/formatters.js'

export const ListEmbeddingsIndicesToolParams = z.object({})

type Params = z.infer<typeof ListEmbeddingsIndicesToolParams>

export async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const config = client.config()

  const indices = await client.request<EmbeddingsIndex[]>({
    uri: `/embeddings-index/${config.dataset}?projectId=${config.projectId}`,
  })

  if (!indices.length) {
    throw new Error('No embeddings indices found')
  }

  const flattenedIndices: Record<string, object> = {}
  for (const index of indices) {
    flattenedIndices[index.indexName] = {
      name: index.indexName,
      status: index.status,
    }
  }

  return createSuccessResponse(
    `Found ${indices.length} embeddings ${pluralize(indices, 'index', 'indices')}`,
    {indices: flattenedIndices},
  )
}

export const listEmbeddingsIndicesTool = withErrorHandling(
  _tool,
  'Error fetching embeddings indices',
)
