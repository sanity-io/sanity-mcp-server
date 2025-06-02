import type {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {EmbeddingsIndex} from '../../types/sanity.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {pluralize} from '../../utils/formatters.js'

export const ListEmbeddingsIndicesToolParams = BaseToolSchema.extend({})

type Params = z.infer<typeof ListEmbeddingsIndicesToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
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
  tool,
  'Error fetching embeddings indices',
)
