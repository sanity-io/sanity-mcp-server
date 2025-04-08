import {sanityClient} from '../../config/sanity.js'
import type {SemanticSearchParamsType} from './schema.js'

export async function semanticSearchTool(args: SemanticSearchParamsType) {
  try {
    const config = sanityClient.config()

    const result = await sanityClient.request({
      uri: `/vX/embeddings-index/query/${config.dataset}/${args.indexName}`,
      method: 'post',
      withCredentials: true,
    })

    function formatSearchResults(results: any[]) {
      if (results.length === 0) {
        return 'No results found'
      }

      return results
        .map((item, index) => {
          const score = (item.score * 100).toFixed(1)
          return `${index + 1}. ${item.value.type} (ID: ${item.value.documentId})
   Relevance: ${score}%`
        })
        .join('\n\n')
    }

    const outputText = formatSearchResults(result)
    return {
      content: [
        {
          type: 'text' as const,
          text: `Semantic Search Results:\n\n${outputText}`,
        },
      ],
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error fetching embeddings indices: ${error}`,
        },
      ],
    }
  }
}
