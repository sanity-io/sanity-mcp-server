import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

export const ListProjectsToolParams = z.object({})

type Params = z.infer<typeof ListProjectsToolParams>

async function tool(_params?: Params) {
  const projects = await sanityClient.projects.list()

  if (projects.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No Sanity projects found for your account.',
        },
      ],
    }
  }

  const projectsByOrganizations: Record<string, typeof projects> = {}

  for (const project of projects) {
    const orgId = project.organizationId as string // All projects have organizationId now; client types are incorrect

    if (!projectsByOrganizations[orgId]) {
      projectsByOrganizations[orgId] = []
    }
    projectsByOrganizations[orgId].push(project)
  }

  const projectsGroupedByOrganization = {
    orgs: {} as Record<string, Array<object>>,
  }

  for (const [orgId, orgProjects] of Object.entries(projectsByOrganizations)) {
    projectsGroupedByOrganization.orgs[`Organization ${orgId}`] = orgProjects.map((project) => ({
      id: project.id,
      name: project.displayName,
      createdAt: project.createdAt,
      members: project.members.length,
    }))
  }

  return createSuccessResponse(
    `Found ${projects.length} Sanity projects in ${Object.keys(projectsGroupedByOrganization.orgs).length} organizations`,
    projectsGroupedByOrganization,
  )
}

export const listProjectsTool = withErrorHandling(tool, 'Error fetching Sanity projects')
