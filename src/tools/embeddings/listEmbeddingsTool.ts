import type {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {EmbeddingsIndex} from '../../types/sanity.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const ListEmbeddingsIndicesToolParams = BaseToolSchema.extend({})

type Params = z.infer<typeof ListEmbeddingsIndicesToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const config = client.config()

  const indices = await client.request<EmbeddingsIndex[]>({
    uri: `/embeddings-index/${config.dataset}?projectId=${config.projectId}`,
  })
  if (!indices.length) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No embeddings indices found',
        },
      ],
    }
  }

  const flattenedIndices: Record<string, object> = {}
  for (const index of indices) {
    flattenedIndices[index.indexName] = {
      name: index.indexName,
      status: index.status,
    }
  }

  return createSuccessResponse(`Found ${indices.length} embeddings indices`, {
    indices: flattenedIndices,
  })
}

export const listEmbeddingsIndicesTool = withErrorHandling(
  tool,
  'Error fetching embeddings indices',
)
