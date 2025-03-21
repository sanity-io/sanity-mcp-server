/**
 * Projects-related tool definitions
 *
 * This file defines all the MCP tool definitions related to Sanity projects
 */
import {z} from 'zod'

import * as projectsController from '../controllers/projects.js'
import type {ToolProvider} from '../types/toolProvider.js'
import type {ToolDefinition} from '../types/tools.js'
import {createErrorResponse} from '../utils/documentHelpers.js'

/**
 * Projects tools provider class
 */
export class ProjectsToolProvider implements ToolProvider {
  /**
   * Get all projects-related tool definitions
   *
   * @returns Array of tool definition objects
   */
  // eslint-disable-next-line class-methods-use-this
  getToolDefinitions(): ToolDefinition[] {
    return ProjectsToolProvider.getToolDefinitionsStatic()
  }

  /**
   * Static method to get all projects-related tool definitions
   * This allows the method to be called without an instance
   *
   * @returns Array of tool definition objects
   */
  static getToolDefinitionsStatic(): ToolDefinition[] {
    return [
      {
        name: 'listOrganizationsAndProjects',
        description: 'List all organizations and their projects for the current user',
        parameters: z.object({}),
        handler: async () => {
          try {
            const result = await projectsController.listOrganizationsAndProjects()
            return result
          } catch (error) {
            return createErrorResponse('Error listing organizations and projects', error as Error)
          }
        }
      },
      {
        name: 'listStudios',
        description: 'List all studios for a project',
        parameters: z.object({
          projectId: z.string().describe('Sanity project ID')
        }),
        handler: async (args) => {
          try {
            const result = await projectsController.listStudios(args.projectId)
            return result
          } catch (error) {
            return createErrorResponse('Error listing studios', error as Error)
          }
        }
      }
    ]
  }
}
