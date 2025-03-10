/**
 * Projects-related tool definitions
 * 
 * This file defines all the MCP tool definitions related to projects and organizations
 */
import { z } from 'zod';
import type { ToolDefinition } from '../types/tools.js';
import type { ToolProvider } from '../types/toolProvider.js';
import * as projectsController from '../controllers/projects.js';
import type { 
  ListStudiosParams, 
  ListCorsOriginsParams, 
  AddCorsOriginParams, 
  CreateApiTokenParams, 
  ListApiTokensParams 
} from '../types/sharedTypes.js';

/**
 * Projects tools provider class
 */
export class ProjectsToolProvider implements ToolProvider {
  /**
   * Get all projects-related tool definitions
   * 
   * @returns Array of tool definition objects
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'listOrganizationsAndProjects',
        description: 'List all organizations and their projects that the user has access to',
        parameters: z.object({}),
        handler: async (_args: {}) => {
          return await projectsController.listOrganizationsAndProjects();
        }
      },
      {
        name: 'listStudios',
        description: 'List all studios for a specific project',
        parameters: z.object({
          projectId: z.string().describe('ID of the project to list studios for')
        }),
        handler: async (args: ListStudiosParams) => {
          return await projectsController.listStudios(args.projectId);
        }
      },
      {
        name: 'list-cors-origins',
        description: 'List all CORS origins for a Sanity project',
        parameters: z.object({
          projectId: z.string().describe('Sanity project ID')
        }),
        handler: async (args: ListCorsOriginsParams) => {
          return await projectsController.listCorsOrigins(args.projectId);
        }
      },
      {
        name: 'add-cors-origin',
        description: 'Add a new CORS origin to a Sanity project',
        parameters: z.object({
          projectId: z.string().describe('Sanity project ID'),
          origin: z.string().url().describe('URL origin to add (e.g., https://example.com)'),
          allowCredentials: z.boolean().optional().describe('Whether to allow credentials (default: true)')
        }),
        handler: async (args: AddCorsOriginParams) => {
          return await projectsController.addCorsOrigin(
            args.projectId,
            args.origin,
            args.allowCredentials
          );
        }
      },
      {
        name: 'create-api-token',
        description: 'Create a new API token for a Sanity project',
        parameters: z.object({
          projectId: z.string().describe('Sanity project ID'),
          label: z.string().describe('Label for the new API token'),
          roleName: z.enum(["administrator", "editor", "developer", "viewer"]).describe('Role for the API key')
        }),
        handler: async (args: CreateApiTokenParams) => {
          return await projectsController.createApiToken(
            args.projectId,
            args.label,
            args.roleName
          );
        }
      },
      {
        name: 'list-api-tokens',
        description: 'List all API tokens for a Sanity project',
        parameters: z.object({
          projectId: z.string().describe('Sanity project ID')
        }),
        handler: async (args: ListApiTokensParams) => {
          return await projectsController.listApiTokens(args.projectId);
        }
      }
    ];
  }
}
