import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import type {EmbeddingsIndex} from '../../types/sanity.js'

export const ListEmbeddingsIndicesToolParams = z.object({})

type Params = z.infer<typeof ListEmbeddingsIndicesToolParams>

export async function listEmbeddingsIndicesTool(_params: Params) {
  try {
    const config = sanityClient.config()
    const indices = await sanityClient.request<EmbeddingsIndex[]>({
      uri: `/vX/embeddings-index/${config.dataset}`,
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
        projection: index.projection,
        filter: index.filter,
      }
    }

    const message = formatResponse(`Found ${indices.length} embeddings indices`, {
      indices: flattenedIndices,
    })

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
        },
      ],
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error fetching embeddings indices: ${errorMessage}`,
        },
      ],
    }
  }
}
