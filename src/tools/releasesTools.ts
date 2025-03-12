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
  UpdateReleaseParams} from '../types/sharedTypes.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'

/**
 * Releases tools provider class
 */
export class ReleasesToolProvider implements ToolProvider {
  /**
   * Get all releases-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'createRelease',
        description: 'Creates a new content release',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          title: z.string().describe('Title for the release'),
          description: z.string().optional().describe('Optional description for the release')
        }),
        handler: async (args: CreateReleaseParams) => {
          const projectId = args.projectId
          const dataset = args.dataset

          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.')
          }

          return await releasesController.createRelease(
            projectId,
            dataset,
            args.title,
            args.description
          )
        }
      },
      {
        name: 'listReleases',
        description: 'Lists all content releases',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project')
        }),
        handler: async (args: ListReleasesParams) => {
          const projectId = args.projectId
          const dataset = args.dataset

          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.')
          }

          return await releasesController.listReleases(projectId, dataset)
        }
      },
      {
        name: 'updateRelease',
        description: 'Updates an existing content release',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          releaseId: z.string().describe('ID of the release to update'),
          title: z.string().optional().describe('New title for the release'),
          description: z.string().optional().describe('New description for the release')
        }),
        handler: async (args: UpdateReleaseParams) => {
          const projectId = args.projectId
          const dataset = args.dataset

          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.')
          }

          return await releasesController.updateRelease(
            projectId,
            dataset,
            args.releaseId,
            {
              title: args.title,
              description: args.description
            }
          )
        }
      },
      {
        name: 'archiveRelease',
        description: 'Archives a content release',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          releaseId: z.string().describe('ID of the release to archive')
        }),
        handler: async (args: ReleaseIdParam) => {
          const projectId = args.projectId
          const dataset = args.dataset

          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.')
          }

          return await releasesController.archiveRelease(projectId, dataset, args.releaseId)
        }
      },
      {
        name: 'addDocumentToRelease',
        description: 'Adds a document to a release',
        parameters: z.object({
          projectId: z.string().describe('Project ID for the Sanity project'),
          dataset: z.string().describe('Dataset name within the project'),
          releaseId: z.string().describe('ID of the release to add the document to'),
          documentId: z.string().describe('ID of the document to add to the release')
        }),
        handler: async (args: AddDocumentToReleaseParams) => {
          const projectId = args.projectId
          const dataset = args.dataset

          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.')
          }

          return await releasesController.addDocumentToRelease(
            projectId,
            dataset,
            args.releaseId,
            args.documentId
          )
        }
      }
    ]
  }
}
