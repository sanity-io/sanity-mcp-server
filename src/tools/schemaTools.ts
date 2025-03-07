/**
 * Schema-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to schema operations
 */
import { z } from 'zod';
import { ToolDefinition } from '../types/tools.js';
import { ToolProvider } from '../types/toolProvider.js';
import * as schemaController from '../controllers/schema.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { 
  GetSchemaParams, 
  ListSchemaTypesParams, 
  GetTypeSchemaParams,
  SchemaTypeDetails
} from '../types/sharedTypes.js';

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
          projectId: z.string().describe('Project ID to use for the request'),
          dataset: z.string().describe('Dataset name to use for the request')
        }) as z.ZodType<GetSchemaParams>,
        handler: async (args: GetSchemaParams): Promise<SchemaTypeDetails[]> => {
          logger.info(`Getting schema for project ${args.projectId}, dataset ${args.dataset}`);
          return await schemaController.getSchema(args.projectId, args.dataset);
        }
      },
      {
        name: 'listSchemaTypes',
        description: 'List all schema types for a project and dataset',
        parameters: z.object({
          projectId: z.string().describe('Project ID to use for the request'),
          dataset: z.string().describe('Dataset name to use for the request'),
          allTypes: z.boolean().optional().describe('Whether to include all types or only document types')
        }) as z.ZodType<ListSchemaTypesParams>,
        handler: async (args: ListSchemaTypesParams): Promise<SchemaTypeDetails[]> => {
          logger.info(`Listing schema types for project ${args.projectId}, dataset ${args.dataset}, allTypes=${args.allTypes || false}`);
          return await schemaController.listSchemaTypes(args.projectId, args.dataset, { allTypes: args.allTypes });
        }
      },
      {
        name: 'getTypeSchema',
        description: 'Get the schema for a specific type',
        parameters: z.object({
          projectId: z.string().describe('Project ID to use for the request'),
          dataset: z.string().describe('Dataset name to use for the request'),
          typeName: z.string().describe('The type name to get the schema for')
        }) as z.ZodType<GetTypeSchemaParams>,
        handler: async (args: GetTypeSchemaParams): Promise<SchemaTypeDetails> => {
          if (!args.typeName) {
            throw new Error('Type name is required');
          }
          
          logger.info(`Getting schema for type ${args.typeName} in project ${args.projectId}, dataset ${args.dataset}`);
          return await schemaController.getTypeSchema(args.projectId, args.dataset, args.typeName);
        }
      }
    ];
  }
}
