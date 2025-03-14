/**
 * Releases-related tool definitions
 *
 * This file defines all the MCP tool definitions related to content releases
 */
import {z} from 'zod'

import config from '../config/config.js'
import * as releasesController from '../controllers/releases.js'
import type {
  AddDocumentToReleaseParams,
  CreateReleaseParams,
  ListReleasesParams,
  ReleaseIdParam,
  UpdateReleaseParams
} from '../types/sharedTypes.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'
import {createErrorResponse} from '../utils/documentHelpers.js'

/**
 * Releases tools provider class
 */
export class ReleasesToolProvider implements ToolProvider {
  /**
   * Get all releases-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  // eslint-disable-next-line class-methods-use-this
  getToolDefinitions(): ToolDefinition[] {
    return ReleasesToolProvider.getToolDefinitionsStatic()
  }

  /**
   * Static method to get all releases-related tool definitions
   * This allows the method to be called without an instance
   *
   * @returns Array of tool definition objects
   */
  static getToolDefinitionsStatic(): ToolDefinition[] {
    return [
      {
        name: 'createRelease',
        description: 'Creates a new content release',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          title: z.string().describe('Title for the release'),
          description: z.string().optional().describe('Optional description for the release')
        }),
        handler: async (args) => {
          try {
            const result = await releasesController.createRelease(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.title,
              args.description
            )
            return result
          } catch (error) {
            return createErrorResponse('Error creating release', error)
          }
        }
      },
      {
        name: 'listReleases',
        description: 'Lists all content releases',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          includeArchived: z.boolean().optional().describe('Whether to include archived releases')
        }),
        handler: async (args) => {
          try {
            const result = await releasesController.listReleases(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production'
            )
            return result
          } catch (error) {
            return createErrorResponse('Error listing releases', error)
          }
        }
      },
      {
        name: 'updateRelease',
        description: 'Updates an existing content release',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          releaseId: z.string().describe('ID of the release to update'),
          title: z.string().optional().describe('New title for the release'),
          description: z.string().optional().describe('New description for the release')
        }),
        handler: async (args) => {
          try {
            const result = await releasesController.updateRelease(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.releaseId,
              {
                title: args.title,
                description: args.description
              }
            )
            return result
          } catch (error) {
            return createErrorResponse('Error updating release', error)
          }
        }
      },
      {
        name: 'archiveRelease',
        description: 'Archives a content release',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          releaseId: z.string().describe('ID of the release to archive')
        }),
        handler: async (args) => {
          try {
            const result = await releasesController.archiveRelease(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.releaseId
            )
            return result
          } catch (error) {
            return createErrorResponse('Error archiving release', error)
          }
        }
      },
      {
        name: 'addDocumentToRelease',
        description: 'Adds a document to a release',
        parameters: z.object({
          projectId: z.string().optional().describe(
            'Project ID, if not provided will use the project ID from the environment'
          ),
          dataset: z.string().optional().describe(
            'Dataset name, if not provided will use the dataset from the environment'
          ),
          releaseId: z.string().describe('ID of the release to add the document to'),
          documentId: z.string().describe('ID of the document to add')
        }),
        handler: async (args) => {
          try {
            const result = await releasesController.addDocumentToRelease(
              args.projectId || config.projectId || '',
              args.dataset || config.dataset || 'production',
              args.releaseId,
              args.documentId
            )
            return result
          } catch (error) {
            return createErrorResponse('Error adding document to release', error)
          }
        }
      }
    ]
  }
}
