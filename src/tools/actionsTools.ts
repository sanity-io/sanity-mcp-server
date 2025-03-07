/**
 * Actions-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to document actions
 */
import { z } from 'zod';
import { ToolDefinition } from '../types/tools.js';
import { ToolProvider } from '../types/toolProvider.js';
import * as actionsController from '../controllers/actions.js';

/**
 * Actions tools provider class
 */
export class ActionsToolProvider implements ToolProvider {
  /**
   * Get all actions-related tool definitions
   * 
   * @returns Array of tool definition objects
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'publishDocument',
        description: 'Publishes a document from draft to published',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          documentId: z.string().describe('The document ID to publish, must include draft. prefix if publishing a draft')
        }),
        handler: async (args: any) => {
          return await actionsController.publishDocument(args.projectId, args.dataset, args.documentId);
        }
      },
      {
        name: 'unpublishDocument',
        description: 'Unpublishes a document, removing the published version',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          documentId: z.string().describe('The document ID to unpublish')
        }),
        handler: async (args: any) => {
          return await actionsController.unpublishDocument(args.projectId, args.dataset, args.documentId);
        }
      },
      {
        name: 'unpublishDocumentWithRelease',
        description: 'Unpublishes a document as part of a release',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          releaseId: z.string().describe('The release ID to unpublish with'),
          documentId: z.string().describe('The document ID to unpublish')
        }),
        handler: async (args: any) => {
          return await actionsController.unpublishDocumentWithRelease(
            args.projectId, 
            args.dataset, 
            args.releaseId, 
            args.documentId
          );
        }
      }
    ];
  }
}
