import {sanityApi} from '../utils/sanityClient.js'

interface Project {
  id: string;
  displayName: string;
  studioHost?: string;
  externalStudioHost?: string;
  organizationId?: string;
}

interface Organization {
  organizationId: string;
  organizationName: string;
  projects: {
    id: string;
    displayName: string;
    studioHost?: string;
    externalStudioHost?: string;
  }[];
}

interface Studio {
  type: 'sanity-hosted' | 'external';
  url: string;
}

interface StudiosResult {
  studios: Studio[];
  message?: string;
}

/**
 * List all organizations and their projects that the user has access to
 *
 * @returns Array of organizations with their projects
 */
export async function listOrganizationsAndProjects(): Promise<Organization[]> {
  try {
    // Fetch all projects
    const projects = await sanityApi.listProjects() as Project[]

    // Group projects by organization
    const orgMap = new Map<string | null, Organization>()

    // Add "Personal Projects" group for projects without organization
    orgMap.set(null, {
      organizationId: 'personal',
      organizationName: 'Personal Projects',
      projects: []
    })

    // Group projects by organization
    projects.forEach((project) => {
      const orgId = project.organizationId || null

      if (!orgMap.has(orgId) && orgId !== null) {
        orgMap.set(orgId, {
          organizationId: orgId,
          organizationName: `Organization ${orgId}`, // We don't have org names from the API
          projects: []
        })
      }

      // Add project to the organization
      const org = orgMap.get(orgId)
      if (org) {
        org.projects.push({
          id: project.id,
          displayName: project.displayName,
          studioHost: project.studioHost,
          externalStudioHost: project.externalStudioHost
        })
      }
    })

    // Convert map to array
    return Array.from(orgMap.values())
      // Remove empty organizations
      .filter((org) => org.projects.length > 0)

  } catch (error: any) {
    console.error('Error listing organizations and projects:', error)
    throw new Error(`Failed to list organizations and projects: ${error.message}`)
  }
}

/**
 * List all studios for a specific project
 *
 * @param projectId - Sanity project ID
 * @returns Array of studio URLs
 */
export async function listStudios(projectId: string): Promise<StudiosResult> {
  try {
    // Fetch all projects to find the one with matching ID
    const projects = await sanityApi.listProjects() as Project[]
    const project = projects.find((p) => p.id === projectId)

    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }

    const studios: Studio[] = []

    // Add Sanity-hosted studio if available
    if (project.studioHost) {
      studios.push({
        type: 'sanity-hosted',
        url: `https://${project.studioHost}.sanity.studio/`
      })
    }

    // Add external studio if available
    if (project.externalStudioHost) {
      studios.push({
        type: 'external',
        url: project.externalStudioHost
      })
    }

    // If no studios found, include a note
    if (studios.length === 0) {
      return {
        studios: [],
        message: 'No hosted studio - Studio may be local only'
      }
    }

    return {studios}

  } catch (error: any) {
    console.error(`Error listing studios for project ${projectId}:`, error)
    throw new Error(`Failed to list studios: ${error.message}`)
  }
}
