/**
 * Embeddings controller for semantic search functionality
 */
import config from '../config/config.js';
import { SanityClient, SanityDocument } from '../types/sanity.js';
import { createSanityClient } from '../utils/sanityClient.js';
import { EmbeddingIndex, SearchOptions, SearchResponse } from '../types/index.js';

// Initialize Sanity client only if project ID is available
const projectId = config.projectId || process.env.SANITY_PROJECT_ID;
const dataset = config.dataset || process.env.SANITY_DATASET;

let sanityClient: SanityClient | undefined;
if (projectId && dataset) {
  sanityClient = createSanityClient(projectId, dataset, {
    apiVersion: config.apiVersion,
    token: config.sanityToken,
    useCdn: false
  });
}

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
      throw new Error("Project ID and Dataset name are required. Please set SANITY_PROJECT_ID and SANITY_DATASET in your environment variables or provide them as parameters.");
    }

    // Validate token exists
    if (!config.sanityToken) {
      throw new Error("SANITY_TOKEN is missing. Please set a valid token in your .env file.");
    }

    // API endpoint format for listing embeddings indices
    // According to docs: https://www.sanity.io/docs/embeddings-index-http-api-reference
    // The correct format is: https://<projectId>.api.sanity.io/vX/embeddings-index/<dataset-name>
    const embeddingsEndpoint = `https://${projectId}.api.sanity.io/vX/embeddings-index/${dataset}`;
    
    // Request to embeddings API
    const response = await fetch(embeddingsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.sanityToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication failed: Your Sanity token is invalid or doesn't have access to embeddings.");
      } else {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const indices = await response.json();
    return indices as EmbeddingIndex[];
  } catch (error: any) {
    console.error("Error listing embeddings indices:", error);
    throw new Error(`Failed to list embeddings indices: ${error.message}`);
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
    // Ensure we have the necessary info
    if (!query) {
      throw new Error("Query parameter is required for semantic search");
    }
    
    if (!indexName) {
      throw new Error("indexName parameter is required for semantic search. Use listEmbeddingsIndices to get available indices.");
    }
    
    if (!projectId || !dataset) {
      throw new Error("Project ID and Dataset name are required. Please set SANITY_PROJECT_ID and SANITY_DATASET in your environment variables or provide them as parameters.");
    }

    // Validate token exists
    if (!config.sanityToken) {
      throw new Error("SANITY_TOKEN is missing. Please set a valid token in your .env file.");
    }

    // According to docs: https://www.sanity.io/docs/embeddings-index-http-api-reference 
    // API endpoint format for querying an embeddings index is:
    // https://<projectId>.api.sanity.io/vX/embeddings-index/query/<dataset-name>/<index-name>
    const embeddingsEndpoint = `https://${projectId}.api.sanity.io/vX/embeddings-index/query/${dataset}/${indexName}`;
    
    // Prepare the request payload
    const requestPayload = {
      query: query,
      limit: maxResults,
      filter: types && types.length > 0 ? `_type in [${types.map(t => `"${t}"`).join(',')}]` : undefined
    };
    
    // Request to embeddings API
    const embeddingsResponse = await fetch(embeddingsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.sanityToken}`
      },
      body: JSON.stringify(requestPayload)
    });

    if (!embeddingsResponse.ok) {
      // Handle specific error cases with helpful messages
      if (embeddingsResponse.status === 401 || embeddingsResponse.status === 403) {
        throw new Error("Authentication failed: Your Sanity token is invalid or doesn't have access to embeddings.");
      } else if (embeddingsResponse.status === 404) {
        throw new Error(`Embeddings index "${indexName}" not found. Use listEmbeddingsIndices to get available indices.`);
      } else {
        const errorText = await embeddingsResponse.text();
        throw new Error(`API request failed with status ${embeddingsResponse.status}: ${errorText}`);
      }
    }
    
    const rawResults = await embeddingsResponse.json();
    
    // The API returns an array of results, not an object
    // Transform to our expected format with hits and total properties for consistency
    if (Array.isArray(rawResults)) {
      return {
        hits: rawResults as SanityDocument[],
        total: rawResults.length
      };
    }
    
    // If for some reason we get an object with hits already, just return it
    if (rawResults.hits) {
      return rawResults as SearchResponse;
    }
    
    // If we somehow got an empty response or invalid format
    return { 
      hits: [], 
      total: 0 
    };
  } catch (error: any) {
    // Provide a helpful error message with additional context
    console.error("Error performing semantic search:", error);
    throw new Error(`Failed to perform semantic search: ${error.message}`);
  }
}
