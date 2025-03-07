/**
 * Schema-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to schema operations
 */
import { z } from 'zod';
import { ToolDefinition } from '../types/tools.js';
import { ToolProvider } from '../types/toolProvider.js';
import * as schemaController from '../controllers/schema.js';

/**
 * Schema tools provider class
 */
export class SchemaToolProvider implements ToolProvider {
  /**
   * Get all schema-related tool definitions
   * 
   * @returns Array of tool definition objects
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'getSchema',
        description: 'Get the complete schema for a project and dataset',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment')
        }),
        handler: async (args: any) => {
          return await schemaController.getSchema(args.projectId, args.dataset);
        }
      },
      {
        name: 'listSchemaTypes',
        description: 'List all schema types for a project and dataset',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          allTypes: z.boolean().optional().describe('Whether to include all types or only document types')
        }),
        handler: async (args: any) => {
          return await schemaController.listSchemaTypes(args.projectId, args.dataset, { allTypes: args.allTypes });
        }
      },
      {
        name: 'getTypeSchema',
        description: 'Get the schema for a specific type',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          typeName: z.string().describe('The type name to get the schema for')
        }),
        handler: async (args: any) => {
          return await schemaController.getTypeSchema(args.projectId, args.dataset, args.typeName);
        }
      }
    ];
  }
}
