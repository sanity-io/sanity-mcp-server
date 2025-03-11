/**
 * Embeddings controller for semantic search functionality
 */
import config from '../config/config.js'
import type {EmbeddingIndex, SearchOptions, SearchResponse, SearchResult} from '../types/index.js'
import logger from '../utils/logger.js'

/**
 * Lists all embeddings indices for a dataset
 *
 * @param options - Options for listing embeddings indices
 * @returns Promise with array of embeddings indices
 */
export async function listEmbeddingsIndices({
  projectId = config.projectId || process.env.SANITY_PROJECT_ID,
  dataset = config.dataset || process.env.SANITY_DATASET
} = {}): Promise<EmbeddingIndex[]> {
  try {
    // Ensure we have the necessary info
    if (!projectId || !dataset) {
      throw new Error('Project ID and Dataset name are required. Please set SANITY_PROJECT_ID and SANITY_DATASET in your environment variables or provide them as parameters.')
    }

    // Validate token exists
    if (!config.sanityToken) {
      throw new Error('SANITY_TOKEN is missing. Please set a valid token in your .env file.')
    }

    // API endpoint format for listing embeddings indices
    // According to docs: https://www.sanity.io/docs/embeddings-index-http-api-reference
    // The correct format is: https://<projectId>.api.sanity.io/vX/embeddings-index/<dataset-name>
    const embeddingsEndpoint = `https://${projectId}.api.sanity.io/vX/embeddings-index/${dataset}`

    // Request to embeddings API
    const response = await fetch(embeddingsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${config.sanityToken}`
      }
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication failed: Your Sanity token is invalid or doesn't have access to embeddings.")
      } else {
        const errorText = await response.text()
        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }
    }

    const indices = await response.json()
    return indices as EmbeddingIndex[]
  } catch (error: any) {
    console.error('Error listing embeddings indices:', error)
    throw new Error(`Failed to list embeddings indices: ${error.message}`)
  }
}

/**
 * Validates the required parameters for semantic search
 */
function validateSearchParameters(query: string, indexName: string | undefined, projectId: string | undefined, dataset: string | undefined) {
  if (!query) {
    throw new Error('Query parameter is required for semantic search')
  }

  if (!indexName) {
    throw new Error('indexName parameter is required for semantic search. Use listEmbeddingsIndices to get available indices.')
  }

  if (!projectId || !dataset) {
    throw new Error('Project ID and Dataset name are required. Please set SANITY_PROJECT_ID and SANITY_DATASET in your environment variables or provide them as parameters.')
  }

  if (!config.sanityToken) {
    throw new Error('SANITY_TOKEN is missing. Please set a valid token in your .env file.')
  }
}

/**
 * Creates the request payload for semantic search
 */
function createSearchPayload(query: string, maxResults: number, types: string[]) {
  return {
    query: query,
    limit: maxResults,
    filter: types && types.length > 0 ? `_type in [${types.map((t) => `"${t}"`).join(',')}]` : undefined
  }
}

/**
 * Processes the API response from the embeddings search
 */
function processSearchResults(rawResults: any): SearchResponse {
  // The API returns an array of results, not an object
  if (Array.isArray(rawResults)) {
    return {
      hits: rawResults.map((doc) => ({
        ...doc,
        score: doc.score || 0,
        value: doc.value || doc
      })) as SearchResult[],
      total: rawResults.length
    }
  }

  // If for some reason we get an object with hits already, just return it
  if (rawResults.hits) {
    return rawResults as SearchResponse
  }

  // If we somehow got an empty response or invalid format
  return {
    hits: [],
    total: 0
  }
}

/**
 * Handles errors from the embeddings API
 */
async function handleEmbeddingsApiError(response: Response, indexName: string): Promise<never> {
  if (response.status === 401 || response.status === 403) {
    throw new Error("Authentication failed: Your Sanity token is invalid or doesn't have access to embeddings.")
  } else if (response.status === 404) {
    throw new Error(`Embeddings index "${indexName}" not found. Use listEmbeddingsIndices to get available indices.`)
  } else {
    const errorText = await response.text()
    throw new Error(`API request failed with status ${response.status}: ${errorText}`)
  }
}

/**
 * Performs semantic search on Sanity documentation and guides using embeddings
 *
 * @param query - Natural language query to search for semantically similar content
 * @param options - Additional search options
 * @returns Promise with search results containing hits and total properties
 */
export async function semanticSearch(query: string, {
  indexName,
  maxResults = 10,
  types = [],
  projectId = config.projectId || process.env.SANITY_PROJECT_ID,
  dataset = config.dataset || process.env.SANITY_DATASET
}: SearchOptions = {} as SearchOptions): Promise<SearchResponse> {
  try {
    // Validate required parameters
    validateSearchParameters(query, indexName, projectId, dataset)

    // According to docs: https://www.sanity.io/docs/embeddings-index-http-api-reference
    // API endpoint format for querying an embeddings index is:
    // https://<projectId>.api.sanity.io/vX/embeddings-index/query/<dataset-name>/<index-name>
    const embeddingsEndpoint = `https://${projectId}.api.sanity.io/vX/embeddings-index/query/${dataset}/${indexName}`

    // Prepare the request payload
    const requestPayload = createSearchPayload(query, maxResults, types)

    // Request to embeddings API
    const embeddingsResponse = await fetch(embeddingsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${config.sanityToken}`
      },
      body: JSON.stringify(requestPayload)
    })

    if (!embeddingsResponse.ok) {
      await handleEmbeddingsApiError(embeddingsResponse, indexName as string)
    }

    const rawResults = await embeddingsResponse.json()
    return processSearchResults(rawResults)

  } catch (error: any) {
    logger.error(`Error performing semantic search: ${error.message}`)
    throw new Error(`Error performing semantic search: ${error.message}`)
  }
}
