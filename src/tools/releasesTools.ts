/**
 * Releases-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to content releases
 */
import { z } from 'zod';
import { ToolDefinition } from '../types/tools.js';
import { ToolProvider } from '../types/toolProvider.js';
import * as releasesController from '../controllers/releases.js';
import { 
  CreateReleaseParams, 
  UpdateReleaseParams, 
  ReleaseIdParam, 
  AddDocumentToReleaseParams,
  RemoveDocumentFromReleaseParams,
  PublishReleaseParams,
  ListReleasesParams
} from '../types/sharedTypes.js';
import config from '../config/config.js';

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
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          title: z.string().describe('Title for the release'),
          description: z.string().optional().describe('Optional description for the release')
        }),
        handler: async (args: CreateReleaseParams) => {
          const projectId = args.projectId || config.projectId;
          const dataset = args.dataset || config.dataset || 'production';
          
          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.');
          }
          
          return await releasesController.createRelease(
            projectId, 
            dataset,
            args.title,
            args.description
          );
        }
      },
      {
        name: 'listReleases',
        description: 'Lists all content releases',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment')
        }),
        handler: async (args: ListReleasesParams) => {
          const projectId = args.projectId || config.projectId;
          const dataset = args.dataset || config.dataset || 'production';
          
          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.');
          }
          
          return await releasesController.listReleases(projectId, dataset);
        }
      },
      {
        name: 'updateRelease',
        description: 'Updates an existing content release',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          releaseId: z.string().describe('ID of the release to update'),
          title: z.string().optional().describe('New title for the release'),
          description: z.string().optional().describe('New description for the release')
        }),
        handler: async (args: UpdateReleaseParams) => {
          const projectId = args.projectId || config.projectId;
          const dataset = args.dataset || config.dataset || 'production';
          
          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.');
          }
          
          return await releasesController.updateRelease(
            projectId,
            dataset,
            args.releaseId,
            {
              title: args.title,
              description: args.description
            }
          );
        }
      },
      {
        name: 'archiveRelease',
        description: 'Archives a content release',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          releaseId: z.string().describe('ID of the release to archive')
        }),
        handler: async (args: ReleaseIdParam) => {
          const projectId = args.projectId || config.projectId;
          const dataset = args.dataset || config.dataset || 'production';
          
          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.');
          }
          
          return await releasesController.archiveRelease(projectId, dataset, args.releaseId);
        }
      },
      {
        name: 'addDocumentToRelease',
        description: 'Adds a document to a release',
        parameters: z.object({
          projectId: z.string().optional().describe('Project ID, if not provided will use the project ID from the environment'),
          dataset: z.string().optional().describe('Dataset name, if not provided will use the dataset from the environment'),
          releaseId: z.string().describe('ID of the release to add the document to'),
          documentId: z.string().describe('ID of the document to add to the release')
        }),
        handler: async (args: AddDocumentToReleaseParams) => {
          const projectId = args.projectId || config.projectId;
          const dataset = args.dataset || config.dataset || 'production';
          
          if (!projectId) {
            throw new Error('Project ID is required. Please provide it as a parameter or set it in the environment.');
          }
          
          return await releasesController.addDocumentToRelease(
            projectId,
            dataset,
            args.releaseId,
            args.documentId
          );
        }
      }
    ];
  }
}
