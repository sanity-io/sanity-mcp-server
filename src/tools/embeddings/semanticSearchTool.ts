import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import type {EmbeddingsQueryResultItem} from '../../types/sanity.js'

export const SemanticSearchToolParams = z.object({
  indexName: z.string().describe('The name of the embeddings index to search'),
  query: z.string().describe('The search query to find semantically similar content'),
})

type Params = z.infer<typeof SemanticSearchToolParams>

export async function semanticSearchTool(params: Params) {
  try {
    const config = sanityClient.config()

    const results = await sanityClient.request<EmbeddingsQueryResultItem[]>({
      uri: `/vX/embeddings-index/query/${config.dataset}/${params.indexName}`,
      method: 'post',
      withCredentials: true,
      body: {
        query: params.query,
      },
    })

    if (!results || results.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No search results found',
          },
        ],
      }
    }

    const formattedResults = results.map((item, index) => ({
      rank: index + 1,
      type: item.value.type,
      documentId: item.value.documentId,
      relevance: `${(item.score * 100).toFixed(1)}%`,
    }))

    const message = formatResponse(
      `Found ${results.length} semantic search results for "${params.query}"`,
      {results: formattedResults},
    )

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
          text: `Error performing semantic search: ${errorMessage}`,
        },
      ],
    }
  }
}
