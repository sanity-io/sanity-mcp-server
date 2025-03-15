/**
 * Actions-related tool definitions
 *
 * This file defines all the MCP tool definitions related to document actions
 */
import {z} from 'zod'

import config from '../config/config.js'
import * as actionsController from '../controllers/actions.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'
import {createErrorResponse} from '../utils/documentHelpers.js'

/**
 * Actions tools provider class
 */
export class ActionsToolProvider implements ToolProvider {
  /**
   * Get all actions-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  // eslint-disable-next-line class-methods-use-this
  getToolDefinitions(): ToolDefinition[] {
    return ActionsToolProvider.getToolDefinitionsStatic()
  }

  /**
   * Static method to get all actions-related tool definitions
   * This allows the method to be called without an instance
   *
   * @returns Array of tool definition objects
   */
  static getToolDefinitionsStatic(): ToolDefinition[] {
    return [
      {
        name: 'publishDocument',
        description: 'Publishes a document to make it publicly available',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          documentId: z.string().describe('The ID of the document to publish'),
        }),
        handler: async (args) => {
          try {
            const result = await actionsController.publishDocument(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.documentId
            )
            return result
          } catch (error) {
            return createErrorResponse('Error publishing document', error as Error)
          }
        }
      },
      {
        name: 'unpublishDocument',
        description: 'Unpublishes a document to make it unavailable to the public',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          documentId: z.string().describe('The ID of the document to unpublish'),
        }),
        handler: async (args) => {
          try {
            const result = await actionsController.unpublishDocument(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.documentId
            )
            return result
          } catch (error) {
            return createErrorResponse('Error unpublishing document', error as Error)
          }
        }
      },
      {
        name: 'deleteDocument',
        description: 'Deletes a document from the Sanity Content Lake',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          documentId: z.string().describe('The ID of the document to delete'),
        }),
        handler: async (args) => {
          try {
            const result = await actionsController.deleteDocument(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              [args.documentId]
            )
            return result
          } catch (error) {
            return createErrorResponse('Error deleting document', error as Error)
          }
        }
      },
      {
        name: 'unpublishDocumentWithRelease',
        description: 'Unpublishes a document as part of a release',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          releaseId: z.string().describe('The release ID to unpublish with'),
          documentId: z.union([z.string(), z.array(z.string())]).describe('The document ID or IDs to unpublish')
        }),
        handler: async (args) => {
          try {
            const result = await actionsController.unpublishDocumentWithRelease(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.releaseId,
              args.documentId
            )
            return result
          } catch (error) {
            return createErrorResponse('Error unpublishing document with release', error as Error)
          }
        }
      },
      {
        name: 'createDocument',
        description: 'Creates a new document in the Sanity Content Lake',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          document: z.record(z.unknown()).describe('The document to create'),
          returnDocuments: z.boolean().optional().describe('Whether to return the created document')
        }),
        handler: async (args) => {
          try {
            if (!args.document._type) {
              throw new Error('Document must have a _type field')
            }

            const result = await actionsController.createDocument(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.document
            )
            return result
          } catch (error) {
            return createErrorResponse('Error creating document', error as Error)
          }
        }
      }
    ]
  }
}
