import { sanityApi } from '../utils/sanityClient.js';

/**
 * List all organizations and their projects that the user has access to
 * 
 * @returns {Promise<Array>} Array of organizations with their projects
 */
export async function listOrganizationsAndProjects() {
  try {
    // Fetch all projects
    const projects = await sanityApi.listProjects();
    
    // Group projects by organization
    const orgMap = new Map();
    
    // Add "Personal Projects" group for projects without organization
    orgMap.set(null, {
      organizationId: 'personal',
      organizationName: 'Personal Projects',
      projects: []
    });
    
    // Group projects by organization
    projects.forEach(project => {
      const orgId = project.organizationId || null;
      
      if (!orgMap.has(orgId) && orgId !== null) {
        orgMap.set(orgId, {
          organizationId: orgId,
          organizationName: `Organization ${orgId}`, // We don't have org names from the API
          projects: []
        });
      }
      
      // Add project to the organization
      orgMap.get(orgId).projects.push({
        id: project.id,
        displayName: project.displayName,
        studioHost: project.studioHost,
        externalStudioHost: project.externalStudioHost
      });
    });
    
    // Convert map to array
    return Array.from(orgMap.values())
      // Remove empty organizations
      .filter(org => org.projects.length > 0);
    
  } catch (error) {
    console.error('Error listing organizations and projects:', error);
    throw new Error(`Failed to list organizations and projects: ${error.message}`);
  }
}

/**
 * List all studios for a specific project
 * 
 * @param {string} projectId - Sanity project ID
 * @returns {Promise<Array>} Array of studio URLs
 */
export async function listStudios(projectId) {
  try {
    // Fetch all projects to find the one with matching ID
    const projects = await sanityApi.listProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    const studios = [];
    
    // Add Sanity-hosted studio if available
    if (project.studioHost) {
      studios.push({
        type: 'sanity-hosted',
        url: `https://${project.studioHost}.sanity.studio/`
      });
    }
    
    // Add external studio if available
    if (project.externalStudioHost) {
      studios.push({
        type: 'external',
        url: project.externalStudioHost
      });
    }
    
    // If no studios found, include a note
    if (studios.length === 0) {
      return {
        studios: [],
        message: 'No hosted studio - Studio may be local only'
      };
    }
    
    return { studios };
    
  } catch (error) {
    console.error(`Error listing studios for project ${projectId}:`, error);
    throw new Error(`Failed to list studios: ${error.message}`);
  }
}
