/**
 * Schema-related tool definitions
 *
 * This file defines all the MCP tool definitions related to schema operations
 */
import {z} from 'zod'

import config from '../config/config.js'
import * as schemaController from '../controllers/schema.js'
import type {
  GetSchemaParams,
  GetTypeSchemaParams,
  ListSchemaTypesParams,
  SchemaTypeDetails
} from '../types/sharedTypes.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'
import {createErrorResponse} from '../utils/documentHelpers.js'
import logger from '../utils/logger.js'

/**
 * Schema tools provider class
 */
export class SchemaToolProvider implements ToolProvider {
  /**
   * Get all schema-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  // eslint-disable-next-line class-methods-use-this
  getToolDefinitions(): ToolDefinition[] {
    return SchemaToolProvider.getToolDefinitionsStatic()
  }

  /**
   * Static method to get all schema-related tool definitions
   * This allows the method to be called without an instance
   *
   * @returns Array of tool definition objects
   */
  static getToolDefinitionsStatic(): ToolDefinition[] {
    return [
      {
        name: 'getSchema',
        description: 'Get the complete schema for a project and dataset',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          )
        }),
        handler: async (args) => {
          try {
            logger.info(`Getting schema for project ${args.projectId || config.projectId}, dataset ${args.dataset || config.dataset}`)
            const result = await schemaController.getSchema(
              args.projectId || config.projectId || '', 
              args.dataset || config.dataset || 'production'
            )
            return result
          } catch (error) {
            return createErrorResponse('Error retrieving schema', error)
          }
        }
      },
      {
        name: 'listSchemaTypes',
        description: 'List all schema types for a project and dataset',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          allTypes: z.boolean().optional().describe('Whether to include all types or only document types')
        }),
        handler: async (args) => {
          try {
            logger.info(
              `Listing schema types for project ${args.projectId || config.projectId}, dataset ${args.dataset || config.dataset}, ` +
              `allTypes=${args.allTypes || false}`
            )
            const result = await schemaController.listSchemaTypes(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              {allTypes: args.allTypes}
            )
            return result
          } catch (error) {
            return createErrorResponse('Error listing schema types', error)
          }
        }
      },
      {
        name: 'getTypeSchema',
        description: 'Get the schema for a specific type',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          typeName: z.string().describe('The type name to get the schema for')
        }),
        handler: async (args) => {
          try {
            if (!args.typeName) {
              throw new Error('Type name is required')
            }

            logger.info(`Getting schema for type ${args.typeName} in project ${args.projectId || config.projectId}, dataset ${args.dataset || config.dataset}`)
            const result = await schemaController.getTypeSchema(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.typeName
            )
            return result
          } catch (error) {
            return createErrorResponse('Error retrieving type schema', error)
          }
        }
      }
    ]
  }
}
