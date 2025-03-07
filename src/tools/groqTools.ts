/**
 * GROQ-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to GROQ querying
 */
import { z } from 'zod';
import { ToolDefinition } from '../types/tools.js';
import { ToolProvider } from '../types/toolProvider.js';
import * as groqController from '../controllers/groq.js';

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
        handler: async () => {
          return await groqController.getGroqSpecification();
        }
      },
      {
        name: 'executeGroq',
        description: 'Run a GROQ query against the dataset',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          query: z.string().describe('GROQ query to run'),
          params: z.record(z.any()).optional().describe('Optional parameters for the GROQ query')
        }),
        handler: async (args: any) => {
          return await groqController.searchContent(
            args.projectId,
            args.dataset,
            args.query,
            args.params || {}
          );
        }
      },
      {
        name: 'query',
        description: 'Run a GROQ query against the dataset',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          query: z.string().describe('GROQ query to run'),
          params: z.record(z.any()).optional().describe('Optional parameters for the GROQ query')
        }),
        handler: async (args: any) => {
          return await groqController.searchContent(
            args.projectId,
            args.dataset,
            args.query,
            args.params || {}
          );
        }
      },
      {
        name: 'getDocument',
        description: 'Get a document by ID or multiple documents by an array of IDs',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          documentId: z.union([z.string(), z.array(z.string())]).describe('ID or array of IDs of the document(s) to retrieve')
        }),
        handler: async (args: any) => {
          const { projectId, dataset, documentId } = args;
          
          if (Array.isArray(documentId)) {
            return await groqController.searchContent(projectId, dataset, '*[_id in $documentIds]', { documentIds: documentId });
          }
          
          return await groqController.searchContent(projectId, dataset, '*[_id == $documentId][0]', { documentId });
        }
      }
    ];
  }
}
