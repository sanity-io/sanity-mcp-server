/* eslint-disable max-lines-per-function */
/**
 * Mutation-related tool definitions
 *
 * This file defines all the MCP tool definitions related to document mutations
 */
import {z} from 'zod'

import * as mutateController from '../controllers/mutate.js'
import type {
  CreateDocumentParams,
  DeleteDocumentParams,
  MutateDocumentsParams,
  MutateDocumentsResult,
  PatchDocumentParams,
  UpdateDocumentParams
} from '../types/sharedTypes.js'
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
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          document: z.record(z.unknown()).describe('Document content to create'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return created documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the create operation')
        }) as z.ZodType<CreateDocumentParams>,
        handler: async (args: CreateDocumentParams): Promise<MutateDocumentsResult> => {
          // Ensure document has a _type field
          if (!args.document._type) {
            throw new Error('Document must have a _type field')
          }

          // Create the mutation with proper typing
          const mutations = [
            {
              create: {
                _type: args.document._type,
                ...args.document
              }
            }
          ]

          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
            mutations,
            args.options?.returnDocuments || false
          )
        }
      },
      {
        name: 'mutateDocument',
        description: 'Apply mutations to documents',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          mutations: z.array(
            z.union([
              z.object({create: z.object({_type: z.string()}).passthrough()}),
              z.object({createOrReplace: z.object({_id: z.string(), _type: z.string()}).passthrough()}),
              z.object({createIfNotExists: z.object({_id: z.string(), _type: z.string()}).passthrough()}),
              z.object({delete: z.object({id: z.string()})}),
              z.object({
                patch: z.object({
                  id: z.string(),
                  ifRevisionID: z.string().optional(),
                  set: z.record(z.unknown()).optional(),
                  setIfMissing: z.record(z.unknown()).optional(),
                  unset: z.union([z.string(), z.array(z.string())]).optional(),
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
        handler: async (args: MutateDocumentsParams): Promise<MutateDocumentsResult> => {
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
            args.mutations,
            args.returnDocuments || false
          )
        }
      },
      {
        name: 'updateDocument',
        description: 'Update an existing document',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          documentId: z.string().describe('ID of the document to update'),
          document: z.record(z.unknown()).describe('Document content to update with'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return updated documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the update operation')
        }) as z.ZodType<UpdateDocumentParams>,
        handler: async (args: UpdateDocumentParams): Promise<MutateDocumentsResult> => {
          // Ensure document has a _type field
          if (!args.document._type) {
            throw new Error('Document must have a _type field')
          }

          // Make sure _id is included in the documen
          const documentWithId = {
            _id: args.documentId,
            _type: args.document._type,
            ...args.document
          }

          const mutations = [{createOrReplace: documentWithId}]
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
            mutations,
            args.options?.returnDocuments || false
          )
        }
      },
      {
        name: 'patchDocument',
        description: 'Patch an existing document with partial updates',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          documentId: z.string().describe('ID of the document to patch'),
          patch: z.object({
            set: z.record(z.unknown()).optional().describe('Fields to set'),
            setIfMissing: z.record(z.unknown()).optional().describe('Fields to set if they are missing'),
            unset: z.array(z.string()).optional().describe('Fields to unset')
          }).describe('Patch operations to apply'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return patched documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the patch operation')
        }) as z.ZodType<PatchDocumentParams>,
        handler: async (args: PatchDocumentParams): Promise<MutateDocumentsResult> => {
          const mutations = [
            {
              patch: {
                id: args.documentId,
                ...args.patch
              }
            }
          ]

          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
            mutations,
            args.options?.returnDocuments || false
          )
        }
      },
      {
        name: 'deleteDocument',
        description: 'Delete a document',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          documentId: z.string().describe('ID of the document to delete'),
          options: z.object({
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the delete operation')
        }) as z.ZodType<DeleteDocumentParams>,
        handler: async (args: DeleteDocumentParams): Promise<MutateDocumentsResult> => {
          const mutations = [
            {
              delete: {id: args.documentId}
            }
          ]

          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
            mutations,
            false
          )
        }
      },
      {
        name: 'batchMutations',
        description: 'Execute a batch of mutations',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          mutations: z.array(
            z.union([
              z.object({create: z.object({_type: z.string()}).passthrough()}),
              z.object({createOrReplace: z.object({_id: z.string(), _type: z.string()}).passthrough()}),
              z.object({createIfNotExists: z.object({_id: z.string(), _type: z.string()}).passthrough()}),
              z.object({delete: z.object({id: z.string()})}),
              z.object({
                patch: z.object({
                  id: z.string(),
                  ifRevisionID: z.string().optional(),
                  set: z.record(z.unknown()).optional(),
                  setIfMissing: z.record(z.unknown()).optional(),
                  unset: z.union([z.string(), z.array(z.string())]).optional(),
                  inc: z.record(z.number()).optional(),
                  dec: z.record(z.number()).optional(),
                  insert: z.unknown().optional(),
                  diffMatchPatch: z.record(z.string()).optional()
                })
              })
            ])
          ).describe('Array of mutation objects'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return modified documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the batch operation')
        }),
        handler: async (args: MutateDocumentsParams): Promise<MutateDocumentsResult> => {
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
            args.mutations,
            args.options?.returnDocuments || false
          )
        }
      }
    ]
  }
}
