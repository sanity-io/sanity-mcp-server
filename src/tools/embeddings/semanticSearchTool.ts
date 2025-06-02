import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {EmbeddingsQueryResultItem} from '../../types/sanity.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {pluralize} from '../../utils/formatters.js'
import {limitByTokens, tokenLimit} from '../../utils/tokens.js'

export const SemanticSearchToolParams = BaseToolSchema.extend({
  indexName: z.string().describe('The name of the embeddings index to search'),
  query: z.string().describe('The search query to find semantically similar content'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe('Maximum number of results to return (subject to token limits)'),
})

type Params = z.infer<typeof SemanticSearchToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const config = client.config()

  const results = await client.request<EmbeddingsQueryResultItem[]>({
    uri: `/embeddings-index/query/${config.dataset}/${params.indexName}`,
    method: 'post',
    withCredentials: true,
    body: {
      query: params.query,
    },
  })

  if (!results || results.length === 0) {
    throw new Error('No search results found')
  }

  const {selectedItems, tokensUsed} = limitByTokens(
    results,
    (item, index) => {
      return JSON.stringify(
        {
          rank: index + 1,
          type: item.value.type,
          documentId: item.value.documentId,
          relevance: `${(item.score * 100).toFixed(1)}%`,
        },
        null,
        2,
      )
    },
    tokenLimit,
    params.limit,
  )

  return createSuccessResponse(
    `Found ${results.length} semantic search ${pluralize(results, 'result')} for "${params.query}", returning ${selectedItems.length} (${tokensUsed} tokens)`,
    {
      results: {result: selectedItems},
      count: selectedItems.length,
      totalAvailable: results.length,
      tokensUsed,
    },
  )
}

export const semanticSearchTool = withErrorHandling(tool, 'Error performing semantic search')
