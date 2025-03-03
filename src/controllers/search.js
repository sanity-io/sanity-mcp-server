/**
 * Search controller for semantic search functionality
 */
import config from '../config/config.js';
import { createClient } from '@sanity/client';

// Initialize Sanity client only if project ID is available
const projectId = config.projectId || process.env.SANITY_PROJECT_ID;
const dataset = config.dataset || process.env.SANITY_DATASET;

let sanityClient;
if (projectId) {
  sanityClient = createClient({
    projectId,
    dataset,
    apiVersion: config.apiVersion,
    token: config.sanityToken,
    useCdn: false
  });
}

/**
 * Performs semantic search on Sanity documentation and guides using embeddings
 * 
 * @param {string} query - Natural language query to search for semantically similar content
 * @param {Object} options - Additional search options
 * @param {number} options.maxResults - Maximum number of results to return (default: 10)
 * @param {string[]} options.types - Optional filter to select specific document types
 * @param {string} options.projectId - The Sanity project ID to use (defaults to config.projectId)
 * @param {string} options.dataset - The dataset to search in (defaults to config.dataset)
 * @returns {Promise<Object>} Search results with scores and total count
 */
export async function semanticSearch(query, { 
  maxResults = 10, 
  types = [],
  projectId = config.projectId || process.env.SANITY_PROJECT_ID,
  dataset = config.dataset || process.env.SANITY_DATASET
} = {}) {
  const indexName = 'docs-guides';

  try {
    // Ensure we have the necessary info
    if (!query) {
      throw new Error("Query parameter is required for semantic search");
    }
    
    if (!projectId) {
      throw new Error("Project ID is required. Please set SANITY_PROJECT_ID in your environment variables or provide it as a parameter.");
    }
    
    if (!dataset) {
      throw new Error("Dataset name is required. Please set SANITY_DATASET in your environment variables or provide it as a parameter.");
    }

    // Validate token exists
    if (!config.sanityToken) {
      throw new Error("SANITY_TOKEN is missing. Please set a valid token in your .env file.");
    }

    // According to docs: https://www.sanity.io/docs/embeddings-index-http-api-reference 
    // API endpoint format is: https://<projectId>.api.sanity.io/vX/embeddings-index/query/<dataset-name>/<index-name>
    const apiVersion = 'v2023-10-01'; // Current API version
    const embeddingsEndpoint = `https://${projectId}.api.sanity.io/${apiVersion}/embeddings-index/query/${dataset}/${indexName}`;
    
    // Request to embeddings API
    const embeddingsResponse = await fetch(embeddingsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.sanityToken}`
      },
      body: JSON.stringify({
        query: query,
        limit: maxResults,
        filter: types && types.length > 0 ? `_type in [${types.map(t => `"${t}"`).join(',')}]` : undefined
      })
    });

    if (!embeddingsResponse.ok) {
      // If first attempt fails with 404, try fallback endpoint format
      if (embeddingsResponse.status === 404) {
        // Try the fallback endpoint - some Sanity setups might use a different path format
        const fallbackEndpoint = `https://${projectId}.api.sanity.io/${apiVersion}/embeddings-index/${dataset}/${indexName}`;
        
        const fallbackResponse = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${config.sanityToken}`
          },
          body: JSON.stringify({
            query: query,
            limit: maxResults,
            filter: types && types.length > 0 ? `_type in [${types.map(t => `"${t}"`).join(',')}]` : undefined
          })
        });
        
        if (fallbackResponse.ok) {
          const results = await fallbackResponse.json();
          
          // If using old API format, transform to match new format for consistent output
          if (results.results && results.totalCount !== undefined) {
            return {
              hits: results.results,
              total: results.totalCount
            };
          }
          
          return results;
        }
      }
      
      // Handle specific error cases with helpful messages
      if (embeddingsResponse.status === 401 || embeddingsResponse.status === 403) {
        throw new Error("Authentication failed: Your Sanity token is invalid or doesn't have access to embeddings.");
      } else if (embeddingsResponse.status === 404) {
        throw new Error(`Embeddings index "${indexName}" not found. You might need to create it first.`);
      } else {
        const errorText = await embeddingsResponse.text();
        throw new Error(`API request failed with status ${embeddingsResponse.status}: ${errorText}`);
      }
    }
    
    const results = await embeddingsResponse.json();
    
    // The API may return an empty array if no results are found
    if (!results.hits || results.hits.length === 0) {
      return { 
        hits: [], 
        total: 0 
      };
    }
    
    return results;
  } catch (error) {
    // Provide a helpful error message with additional context
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Sanity semantic search failed: ${errorMessage} - Make sure the 'docs-guides' embeddings index exists and is properly configured in the '${dataset}' dataset.`);
  }
}
