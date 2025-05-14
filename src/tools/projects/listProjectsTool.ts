import type {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {pluralize} from '../../utils/formatters.js'

export const ListProjectsToolParams = BaseToolSchema.extend({})

type Params = z.infer<typeof ListProjectsToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const projects = await client.projects.list()

  if (projects.length === 0) {
    throw new Error('No Sanity projects found for your account.')
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
    `Found ${projects.length} ${pluralize(projects, 'project')} in ${Object.keys(projectsGroupedByOrganization.orgs).length} ${pluralize(Object.keys(projectsGroupedByOrganization.orgs).length, 'organization')}`,
    projectsGroupedByOrganization,
  )
}

export const listProjectsTool = withErrorHandling(tool, 'Error fetching Sanity projects')
