/**
 * Mutation-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to document mutations
 */
import { z } from 'zod';
import type { ToolDefinition } from '../types/tools.js';
import type { ToolProvider } from '../types/toolProvider.js';
import * as mutateController from '../controllers/mutate.js';
import type { 
  CreateDocumentParams, 
  MutateDocumentsParams,
  UpdateDocumentParams, 
  PatchDocumentParams, 
  DeleteDocumentParams, 
  MutateDocumentsResult 
} from '../types/sharedTypes.js';
import config from '../config/config.js';

/**
 * Mutation tools provider class
 */
export class MutateToolProvider implements ToolProvider {
  /**
   * Get all mutation-related tool definitions
   * 
   * @returns Array of tool definition objects
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'createDocument',
        description: 'Create a new document',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          document: z.record(z.any()).describe('Document content to create'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return created documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the create operation')
        }) as z.ZodType<CreateDocumentParams>,
        handler: async (args: CreateDocumentParams): Promise<MutateDocumentsResult> => {
          // Ensure document has a _type field
          if (!args.document['_type']) {
            throw new Error('Document must have a _type field');
          }
          
          // Create the mutation with proper typing
          const mutations = [{ 
            create: {
              _type: args.document['_type'],
              ...args.document
            } 
          }];
          
          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            mutations,
            args.options?.returnDocuments || false
          );
        }
      },
      {
        name: 'mutateDocument',
        description: 'Apply mutations to documents',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          mutations: z.array(
            z.union([
              z.object({ create: z.object({ _type: z.string() }).passthrough() }),
              z.object({ createOrReplace: z.object({ _id: z.string(), _type: z.string() }).passthrough() }),
              z.object({ createIfNotExists: z.object({ _id: z.string(), _type: z.string() }).passthrough() }),
              z.object({ delete: z.object({ id: z.string() }) }),
              z.object({ 
                patch: z.object({ 
                  id: z.string(),
                  ifRevisionID: z.string().optional(),
                  set: z.record(z.any()).optional(),
                  setIfMissing: z.record(z.any()).optional(),
                  unset: z.union([z.string(), z.array(z.string())]).optional(),
                  inc: z.record(z.number()).optional(),
                  dec: z.record(z.number()).optional(),
                  insert: z.any().optional(),
                  diffMatchPatch: z.record(z.string()).optional()
                })
              })
            ])
          ).describe('Array of mutation objects'),
          returnDocuments: z.boolean().optional().describe('Whether to return modified documents')
        }),
        handler: async (args: MutateDocumentsParams): Promise<MutateDocumentsResult> => {
          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            args.mutations,
            args.returnDocuments || false
          );
        }
      },
      {
        name: 'updateDocument',
        description: 'Update an existing document',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          documentId: z.string().describe('ID of the document to update'),
          document: z.record(z.any()).describe('Document content to update with'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return updated documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the update operation')
        }) as z.ZodType<UpdateDocumentParams>,
        handler: async (args: UpdateDocumentParams): Promise<MutateDocumentsResult> => {
          // Ensure document has a _type field
          if (!args.document['_type']) {
            throw new Error('Document must have a _type field');
          }
          
          // Make sure _id is included in the document
          const documentWithId = {
            _id: args.documentId,
            _type: args.document['_type'],
            ...args.document
          };
          
          const mutations = [{ createOrReplace: documentWithId }];
          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production', 
            mutations,
            args.options?.returnDocuments || false
          );
        }
      },
      {
        name: 'patchDocument',
        description: 'Patch an existing document with partial updates',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          documentId: z.string().describe('ID of the document to patch'),
          patch: z.object({
            set: z.record(z.any()).optional().describe('Fields to set'),
            setIfMissing: z.record(z.any()).optional().describe('Fields to set if they are missing'),
            unset: z.array(z.string()).optional().describe('Fields to unset')
          }).describe('Patch operations to apply'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return patched documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the patch operation')
        }) as z.ZodType<PatchDocumentParams>,
        handler: async (args: PatchDocumentParams): Promise<MutateDocumentsResult> => {
          const mutations = [{
            patch: {
              id: args.documentId,
              ...args.patch
            }
          }];
          
          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            mutations,
            args.options?.returnDocuments || false
          );
        }
      },
      {
        name: 'deleteDocument',
        description: 'Delete a document',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          documentId: z.string().describe('ID of the document to delete'),
          options: z.object({
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the delete operation')
        }) as z.ZodType<DeleteDocumentParams>,
        handler: async (args: DeleteDocumentParams): Promise<MutateDocumentsResult> => {
          const mutations = [{
            delete: { id: args.documentId }
          }];
          
          return await mutateController.modifyDocuments(
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            mutations,
            false
          );
        }
      },
      {
        name: 'batchMutations',
        description: 'Execute a batch of mutations',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          mutations: z.array(
            z.union([
              z.object({ create: z.object({ _type: z.string() }).passthrough() }),
              z.object({ createOrReplace: z.object({ _id: z.string(), _type: z.string() }).passthrough() }),
              z.object({ createIfNotExists: z.object({ _id: z.string(), _type: z.string() }).passthrough() }),
              z.object({ delete: z.object({ id: z.string() }) }),
              z.object({ 
                patch: z.object({ 
                  id: z.string(),
                  ifRevisionID: z.string().optional(),
                  set: z.record(z.any()).optional(),
                  setIfMissing: z.record(z.any()).optional(),
                  unset: z.union([z.string(), z.array(z.string())]).optional(),
                  inc: z.record(z.number()).optional(),
                  dec: z.record(z.number()).optional(),
                  insert: z.any().optional(),
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
            args.projectId || config.projectId || '',
            args.dataset || config.dataset || 'production',
            args.mutations,
            args.options?.returnDocuments || false
          );
        }
      }
    ];
  }
}
