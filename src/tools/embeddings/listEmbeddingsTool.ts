import {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'
import {sanityClient} from '../../config/sanity.js'

export async function listEmbeddingsIndicesTool(args: {}, extra: RequestHandlerExtra) {
  try {
    const config = sanityClient.config()
    const apiHost = config.apiHost.replace('https://', '')
    const embeddingsEndpoint = `https://${config.projectId}.${apiHost}/vX/embeddings-index/${config.dataset}`
    const response = await fetch(embeddingsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const indices = await response.json()

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

    const formattedIndices = indices
      .map((index: any) => {
        return `  • Index: ${index.indexName}
    Status: ${index.status}
    Project ID: ${index.projectId}
    Dataset: ${index.dataset}
    Projection: ${index.projection}
    Filter: ${index.filter}
    Created At: ${index.createdAt}
    Updated At: ${index.updatedAt}
    Failed Document Count: ${index.failedDocumentCount}
    Start Document Count: ${index.startDocumentCount}
    Remaining Document Count: ${index.remainingDocumentCount}
    Webhook ID: ${index.webhookId}`
      })
      .join('\n\n')

    return {
      content: [
        {
          type: 'text' as const,
          text:
            indices.length === 1
              ? `Found 1 embeddings index:\n${formattedIndices}`
              : `Found ${indices.length} embeddings indices:\n${formattedIndices}`,
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
