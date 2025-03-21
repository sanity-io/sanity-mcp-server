/**
 * Embeddings-related tool definitions
 *
 * This file defines all the MCP tool definitions related to embeddings
 */
import {z} from 'zod'

import config from '../config/config.js'
import * as embeddingsController from '../controllers/embeddings.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'
import {createErrorResponse} from '../utils/documentHelpers.js'

/**
 * Embeddings tools provider class
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
      {
        name: 'listEmbeddingsIndices',
        description: 'List all embeddings indices for a project',
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
            return createErrorResponse('Error listing embeddings indices', error as Error)
          }
        }
      },
      {
        name: 'semanticSearch',
        description: 'Perform semantic search on documents using embeddings',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          indexName: z.string().describe('Name of the embeddings index to search'),
          query: z.string().describe('The query to search for'),
          maxResults: z.number().optional().describe('Maximum number of results to return (default: 10)'),
          types: z.array(z.string()).optional().describe('Document types to filter results by'),
          filter: z.string().optional().describe('GROQ filter to apply to search results')
        }),
        handler: async (args) => {
          try {
            const result = await embeddingsController.semanticSearch(
              args.query,
              {
                projectId: args.projectId || config.projectId || '',
                dataset: args.dataset || config.dataset || 'production',
                indexName: args.indexName,
                maxResults: args.maxResults,
                types: args.types || (args.filter ? [args.filter] : undefined)
              }
            )
            return result
          } catch (error) {
            return createErrorResponse('Error performing semantic search', error as Error)
          }
        }
      }
    ]
  }
}
