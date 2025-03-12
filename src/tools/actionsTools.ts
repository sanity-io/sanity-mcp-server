/**
 * Actions-related tool definitions
 *
 * This file defines all the MCP tool definitions related to document actions
 */
import {z} from 'zod'

import config from '../config/config.js'
import * as actionsController from '../controllers/actions.js'
import type {
  ActionResult,
  DocumentIdParam,
  ReleaseDocumentIdParam} from '../types/sharedTypes.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'

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
        description: 'Publish one or more draft documents',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          documentId: z.union([z.string(), z.array(z.string())]).describe('The document ID or IDs to publish, must include draft. prefix if publishing a draft')
        }) as z.ZodType<DocumentIdParam>,
        handler: async (args: DocumentIdParam): Promise<ActionResult> => {
          return await actionsController.publishDocument(
            args.projectId, 
            args.dataset, 
            args.documentId
          )
        }
      },
      {
        name: 'unpublishDocument',
        description: 'Unpublish one or more documents (make them drafts only)',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          documentId: z.union([z.string(), z.array(z.string())]).describe('The document ID or IDs to unpublish')
        }) as z.ZodType<DocumentIdParam>,
        handler: async (args: DocumentIdParam): Promise<ActionResult> => {
          return await actionsController.unpublishDocument(
            args.projectId, 
            args.dataset, 
            args.documentId
          )
        }
      },
      {
        name: 'deleteDocument',
        description: 'Delete one or more documents including their drafts',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          documentId: z.union([z.string(), z.array(z.string())]).describe('The document ID or IDs to delete')
        }) as z.ZodType<DocumentIdParam>,
        handler: async (args: DocumentIdParam): Promise<ActionResult> => {
          return await actionsController.deleteDocument(
            args.projectId, 
            args.dataset, 
            args.documentId
          )
        }
      },
      {
        name: 'unpublishDocumentWithRelease',
        description: 'Unpublishes a document as part of a release',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          releaseId: z.string().describe('The release ID to unpublish with'),
          documentId: z.union([z.string(), z.array(z.string())]).describe('The document ID or IDs to unpublish')
        }) as z.ZodType<ReleaseDocumentIdParam>,
        handler: async (args: ReleaseDocumentIdParam): Promise<ActionResult> => {
          return await actionsController.unpublishDocumentWithRelease(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            args.releaseId,
            args.documentId
          )
        }
      }
    ]
  }
}
