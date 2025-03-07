/**
 * Embeddings-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to embeddings and semantic search
 */
import { z } from 'zod';
import { ToolDefinition } from '../types/tools.js';
import { ToolProvider } from '../types/toolProvider.js';
import * as embeddingsController from '../controllers/embeddings.js';

/**
 * Embeddings tools provider class
 */
export class EmbeddingsToolProvider implements ToolProvider {
  /**
   * Get all embeddings-related tool definitions
   * 
   * @returns Array of tool definition objects
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'listEmbeddingsIndices',
        description: 'List all embeddings indices for a project and dataset',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment')
        }),
        handler: async (args: any) => {
          return await embeddingsController.listEmbeddingsIndices(args);
        }
      },
      {
        name: 'semanticSearch',
        description: 'Perform a semantic search query against an embeddings index',
        parameters: z.object({
          query: z.string().describe('The search query to match documents against'),
          indexName: z.string().describe('The name of the embeddings index to search'),
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          maxResults: z.number().optional().default(10).describe('Maximum number of results to return'),
          types: z.union([z.string(), z.array(z.string())]).optional().describe('Document type(s) to filter by')
        }),
        handler: async (args: any) => {
          return await embeddingsController.semanticSearch({
            projectId: args.projectId,
            dataset: args.dataset,
            query: args.query,
            indexName: args.indexName,
            maxResults: args.maxResults,
            types: args.types
          });
        }
      }
    ];
  }
}
