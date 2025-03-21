/**
 * GROQ-related tool definitions
 *
 * This file defines all the MCP tool definitions related to GROQ queries
 */
import {z} from 'zod'

import config from '../config/config.js'
import * as groqController from '../controllers/groq.js'
import type {GroqSpecResult, GroqSpecification} from '../types/sharedTypes.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'
import logger from '../utils/logger.js'

/**
 * GROQ tools provider class
 */
export class GroqToolProvider implements ToolProvider {
  /**
   * Get all GROQ-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  // eslint-disable-next-line class-methods-use-this
  getToolDefinitions(): ToolDefinition[] {
    return GroqToolProvider.getToolDefinitionsStatic()
  }

  /**
   * Static method to get all GROQ-related tool definitions
   * This allows the method to be called without an instance
   *
   * @returns Array of tool definition objects
   */
  static getToolDefinitionsStatic(): ToolDefinition[] {
    return [
      {
        name: 'getGroqSpecification',
        description: 'Get the GROQ language specification',
        parameters: z.object({}),
        handler: async (): Promise<GroqSpecResult> => {
          try {
            const result = await groqController.getGroqSpecification()
            return result
          } catch (error) {
            // Return a minimal valid GroqSpecResult with error information
            logger.error('Error retrieving GROQ specification:', error)
            
            const fallbackSpec: GroqSpecification = {
              name: 'GROQ',
              version: 'unknown',
              description: 'Error retrieving specification',
              coreFeatures: [],
              queryStructure: [],
              operators: [],
              examples: [],
              functions: [],
              resources: []
            }
            
            return {
              specification: fallbackSpec,
              source: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          }
        }
      },
      {
        name: 'executeGroq',
        description: 'Run a GROQ query against the dataset',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          query: z.string().describe('GROQ query to run'),
          params: z.record(z.unknown()).optional().describe('Optional parameters for the GROQ query')
        }),
        handler: async (args) => {
          // Ensure we have required values
          if (!args.projectId) {
            throw new Error('Project ID is required')
          }
          if (!args.dataset) {
            throw new Error('Dataset is required')
          }
          if (!args.query) {
            throw new Error('Query is required')
          }
          
          return await groqController.searchContent(
            args.projectId,
            args.dataset,
            args.query,
            args.params || {}
          )
        }
      },
      {
        name: 'query',
        description: 'Run a GROQ query against the dataset',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().optional().describe('Sanity dataset. Uses default dataset if omitted.'),
          query: z.string().describe('GROQ query to run'),
          params: z.record(z.unknown()).optional().describe('Optional parameters for the GROQ query')
        }),
        handler: async (args) => {
          // Ensure we have required values
          if (!args.projectId) {
            throw new Error('Project ID is required')
          }
          
          // Use a default dataset if not provided
          const dataset = args.dataset || 'production'
          
          return await groqController.searchContent(
            args.projectId,
            dataset,
            args.query,
            args.params || {}
          )
        }
      },
      {
        name: 'getDocument',
        description: 'Get a document by ID or multiple documents by an array of IDs',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          documentId: z.union([z.string(), z.array(z.string())]).describe(
            'ID or array of IDs of the document(s) to retrieve'
          )
        }),
        handler: async (args) => {
          // Ensure we have required values
          if (!args.projectId) {
            throw new Error('Project ID is required')
          }
          if (!args.dataset) {
            throw new Error('Dataset is required')
          }
          
          const {projectId, dataset, documentId} = args

          if (Array.isArray(documentId)) {
            return await groqController.searchContent(
              projectId,
              dataset,
              '*[_id in $documentIds]',
              {documentIds: documentId}
            )
          }

          return await groqController.searchContent(
            projectId,
            dataset,
            '*[_id == $documentId][0]',
            {documentId}
          )
        }
      },
      {
        name: 'searchContent',
        description: 'Search content in Sanity dataset using GROQ',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          query: z.string().describe('GROQ query string'),
          params: z.record(z.unknown()).optional().describe('Parameters for the GROQ query')
        }),
        handler: async (args) => {
          try {
            const projectId = args.projectId || config.projectId
            const dataset = args.dataset || config.dataset
            
            if (!projectId || !dataset) {
              const errorMsg = 'Project ID and Dataset name are required. ' +
                'Please set SANITY_PROJECT_ID and SANITY_DATASET in your environment variables ' +
                'or provide them as parameters.'
              throw new Error(errorMsg)
            }
            
            return await groqController.searchContent(
              projectId,
              dataset,
              args.query,
              args.params
            )
          } catch (error) {
            logger.error('Error executing GROQ query:', error)
            throw error
          }
        }
      }
    ]
  }
}
