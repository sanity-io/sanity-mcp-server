/* eslint-disable max-lines-per-function */
/**
 * Mutation-related tool definitions
 *
 * This file defines all the MCP tool definitions related to document mutations
 */
import {z} from 'zod'

import config from '../config/config.js'
import * as mutateController from '../controllers/mutate.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'

/**
 * Mutation tools provider class
 */
export class MutateToolProvider implements ToolProvider {
  /**
   * Get all mutation-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  // eslint-disable-next-line class-methods-use-this
  getToolDefinitions(): ToolDefinition[] {
    return MutateToolProvider.getToolDefinitionsStatic()
  }

  /**
   * Static method to get all mutation-related tool definitions
   * This allows the method to be called without an instance
   *
   * @returns Array of tool definition objects
   */
  static getToolDefinitionsStatic(): ToolDefinition[] {
    return [
      {
        name: 'createDocument',
        description: 'Create a new document',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          document: z.record(z.unknown()).describe('Document to create'),
          returnDocuments: z.boolean().optional().describe('Whether to return created documents')
        }),
        handler: async (args) => {
          // Ensure document has a _type field
          if (!args.document._type) {
            throw new Error('Document must have a _type field')
          }

          // Construct mutations array
          const mutations = [{create: args.document}]

          // Call modifyDocuments with the mutations
          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            mutations,
            args.returnDocuments || false
          )
        }
      },
      {
        name: 'modifyDocuments',
        description: 'Apply multiple mutations to documents',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          mutations: z.array(
            z.union([
              z.object({
                create: z.record(z.unknown())
              }),
              z.object({
                createIfNotExists: z.record(z.unknown())
              }),
              z.object({
                createOrReplace: z.record(z.unknown())
              }),
              z.object({
                delete: z.object({
                  id: z.string()
                })
              }),
              z.object({
                patch: z.object({
                  id: z.string(),
                  query: z.string().optional(),
                  ifRevisionID: z.string().optional(),
                  unset: z.union([z.string(), z.array(z.string())]).optional(),
                  set: z.record(z.unknown()).optional(),
                  setIfMissing: z.record(z.unknown()).optional(),
                  inc: z.record(z.number()).optional(),
                  dec: z.record(z.number()).optional(),
                  insert: z.unknown().optional(),
                  diffMatchPatch: z.record(z.string()).optional()
                })
              })
            ])
          ).describe('Array of mutation objects'),
          returnDocuments: z.boolean().optional().describe('Whether to return modified documents')
        }),
        handler: async (args) => {
          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            args.mutations,
            args.returnDocuments || false
          )
        }
      },
      {
        name: 'updateDocument',
        description: 'Update an existing document',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          documentId: z.string().describe('ID of the document to update'),
          document: z.record(z.unknown()).describe('Document content to update with'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return updated documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the update operation')
        }),
        handler: async (args) => {
          // Ensure document has a _type field
          if (!args.document._type) {
            throw new Error('Document must have a _type field')
          }

          // Make sure _id is included in the document
          const documentWithId = {
            _id: args.documentId,
            _type: args.document._type,
            ...args.document
          }

          const mutations = [{createOrReplace: documentWithId}]
          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            mutations,
            args.options?.returnDocuments || false,
            {visibility: args.options?.visibility}
          )
        }
      },
      {
        name: 'patchDocument',
        description: 'Apply a patch to a document',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          documentId: z.string().describe('ID of the document to patch'),
          patch: z.object({
            set: z.record(z.unknown()).optional().describe('Fields to set'),
            setIfMissing: z.record(z.unknown()).optional().describe('Fields to set if missing'),
            unset: z.union([z.string(), z.array(z.string())]).optional().describe('Fields to unset'),
            inc: z.record(z.number()).optional().describe('Fields to increment'),
            dec: z.record(z.number()).optional().describe('Fields to decrement'),
            insert: z.unknown().optional().describe('Insert operation'),
            diffMatchPatch: z.record(z.string()).optional().describe('Diff match patch operations')
          }).describe('Patch operations to apply'),
          returnDocuments: z.boolean().optional().describe('Whether to return patched documents')
        }),
        handler: async (args) => {
          const mutations = [
            {
              patch: {
                id: args.documentId,
                ...args.patch
              }
            }
          ]

          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            mutations,
            args.returnDocuments || false
          )
        }
      },
      {
        name: 'deleteDocument',
        description: 'Delete a document',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          documentId: z.string().describe('ID of the document to delete'),
          returnDocuments: z.boolean().optional().describe('Whether to return deleted documents')
        }),
        handler: async (args) => {
          const mutations = [
            {
              delete: {
                id: args.documentId
              }
            }
          ]

          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            mutations,
            args.returnDocuments || false
          )
        }
      }
    ]
  }
}
