/**
 * Mutation-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to document mutations
 */
import { z } from 'zod';
import { ToolDefinition } from '../types/tools.js';
import { ToolProvider } from '../types/toolProvider.js';
import * as mutateController from '../controllers/mutate.js';

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
        }),
        handler: async (args: any) => {
          const mutations = [{ create: args.document }];
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
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
          mutations: z.array(z.record(z.any())).describe('Array of mutation objects'),
          returnDocuments: z.boolean().optional().describe('Whether to return modified documents')
        }),
        handler: async (args: any) => {
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
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
        }),
        handler: async (args: any) => {
          // Make sure _id is included in the document
          const documentWithId = {
            _id: args.documentId,
            ...args.document
          };
          
          const mutations = [{ createOrReplace: documentWithId }];
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset, 
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
        }),
        handler: async (args: any) => {
          const mutations = [{
            patch: {
              id: args.documentId,
              ...args.patch
            }
          }];
          
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
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
        }),
        handler: async (args: any) => {
          const mutations = [{
            delete: { id: args.documentId }
          }];
          
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
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
          mutations: z.array(z.record(z.any())).describe('Array of mutation objects'),
          options: z.object({
            returnDocuments: z.boolean().optional().describe('Whether to return modified documents'),
            visibility: z.enum(['sync', 'async', 'deferred']).optional().describe('Transaction visibility')
          }).optional().describe('Options for the batch operation')
        }),
        handler: async (args: any) => {
          return await mutateController.modifyDocuments(
            args.projectId,
            args.dataset,
            args.mutations,
            args.options?.returnDocuments || false
          );
        }
      }
    ];
  }
}
