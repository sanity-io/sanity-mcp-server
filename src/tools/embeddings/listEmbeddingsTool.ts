import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {EmbeddingsIndex} from '../../types/sanity.js'

export const ListEmbeddingsIndicesToolParams = z.object({})

type Params = z.infer<typeof ListEmbeddingsIndicesToolParams>

async function tool(_params?: Params) {
  const config = sanityClient.config()

  const indices = await sanityClient.request<EmbeddingsIndex[]>({
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
