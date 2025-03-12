/**
 * GROQ-related tool definitions
 *
 * This file defines all the MCP tool definitions related to GROQ querying
 */
import {z} from 'zod'

import config from '../config/config.js'
import * as groqController from '../controllers/groq.js'
import type {
  GetDocumentParams,
  GroqQueryParams,
  GroqQueryResult,
  GroqSpecResult
} from '../types/sharedTypes.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'

/**
 * GROQ tools provider class
 */
export class GroqToolProvider implements ToolProvider {
  /**
   * Get all GROQ-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'getGroqSpecification',
        description: 'Get the GROQ language specification',
        parameters: z.object({}),
        handler: async (): Promise<GroqSpecResult> => {
          return await groqController.getGroqSpecification()
        }
      },
      {
        name: 'executeGroq',
        description: 'Run a GROQ query against the dataset',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          query: z.string().describe('GROQ query to run'),
          params: z.record(z.any()).optional().describe('Optional parameters for the GROQ query')
        }) as z.ZodType<GroqQueryParams>,
        handler: async (args: GroqQueryParams): Promise<GroqQueryResult> => {
          return await groqController.searchContent(
            args.projectId,
            args.dataset,
            args.query,
            args.params || {}
          )
        }
      },
      {
        name: 'query',
        description: 'Run a GROQ query against the dataset',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          query: z.string().describe('GROQ query to run'),
          params: z.record(z.any()).optional().describe('Optional parameters for the GROQ query')
        }) as z.ZodType<GroqQueryParams>,
        handler: async (args: GroqQueryParams): Promise<GroqQueryResult> => {
          return await groqController.searchContent(
            args.projectId,
            args.dataset,
            args.query,
            args.params || {}
          )
        }
      },
      {
        name: 'getDocument',
        description: 'Get a document by ID or multiple documents by an array of IDs',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          documentId: z.union([z.string(), z.array(z.string())]).describe('ID or array of IDs of the document(s) to retrieve')
        }) as z.ZodType<GetDocumentParams>,
        handler: async (args: GetDocumentParams): Promise<GroqQueryResult> => {
          const {projectId, dataset, documentId} = args

          if (Array.isArray(documentId)) {
            return await groqController.searchContent(projectId, dataset, '*[_id in $documentIds]', {documentIds: documentId})
          }

          return await groqController.searchContent(projectId, dataset, '*[_id == $documentId][0]', {documentId})
        }
      }
    ]
  }
}
