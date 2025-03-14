/**
 * Embeddings-related tool definitions
 *
 * This file defines all the MCP tool definitions related to embeddings and semantic search
 */
import {z} from 'zod'

import * as embeddingsController from '../controllers/embeddings.js'
import type {ListEmbeddingsIndicesParams, SemanticSearchParams} from '../types/sharedTypes.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'
import config from '../config/config.js'
import { createErrorResponse } from '../utils/documentHelpers.js'

/**
 * Provider for embeddings-related tool definitions
 */
export class EmbeddingsToolProvider implements ToolProvider {
  /**
   * Get all embeddings-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  // eslint-disable-next-line class-methods-use-this
  getToolDefinitions(): ToolDefinition[] {
    return EmbeddingsToolProvider.getToolDefinitionsStatic()
  }

  /**
   * Static method to get all embeddings-related tool definitions
   * This allows the method to be called without an instance
   *
   * @returns Array of tool definition objects
   */
  static getToolDefinitionsStatic(): ToolDefinition[] {
    return [
      listEmbeddingsIndices,
      semanticSearch
    ]
  }
}

export const listEmbeddingsIndices: ToolDefinition = {
  name: 'listEmbeddingsIndices',
  description: 'Lists all available embeddings indices for a project and dataset',
  parameters: z.object({
    projectId: z.string().optional().describe(
      'Project ID, if not provided will use the project ID from the environment'
    ),
    dataset: z.string().optional().describe(
      'Dataset name, if not provided will use the dataset from the environment'
    )
  }),
  handler: async (args) => {
    try {
      const result = await embeddingsController.listEmbeddingsIndices({
        projectId: args.projectId || config.projectId || '',
        dataset: args.dataset || config.dataset || 'production'
      })
      return result
    } catch (error) {
      return createErrorResponse('Error listing embeddings indices', error)
    }
  }
}

export const semanticSearch: ToolDefinition = {
  name: 'semanticSearch',
  description: 'Performs a semantic search using embeddings',
  parameters: z.object({
    projectId: z.string().optional().describe(
      'Project ID, if not provided will use the project ID from the environment'
    ),
    dataset: z.string().optional().describe(
      'Dataset name, if not provided will use the dataset from the environment'
    ),
    indexName: z.string().describe('The name of the embeddings index to search'),
    query: z.string().describe('The search query text'),
    limit: z.number().optional().describe('Maximum number of results to return (default: 10)'),
    filter: z.string().optional().describe('Optional GROQ filter to apply to the results')
  }),
  handler: async (args) => {
    try {
      const result = await embeddingsController.semanticSearch(
        args.query,
        {
          projectId: args.projectId || config.projectId || '',
          dataset: args.dataset || config.dataset || 'production',
          indexName: args.indexName,
          maxResults: args.limit,
          types: args.filter ? [args.filter] : undefined
        }
      )
      return result
    } catch (error) {
      return createErrorResponse('Error performing semantic search', error)
    }
  }
}
