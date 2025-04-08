import {SanityProject} from '@sanity/client'
import {sanityClient} from '../../config/sanity.js'
import {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'

export async function getProjectsTool(args: {}, extra: RequestHandlerExtra) {
  try {
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

    const projectsByOrganizations = projects.reduce(
      (acc, project) => {
        const orgId = project.organizationId
        const key = orgId === null ? 'personal' : orgId

        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(project)
        return acc
      },
      {} as Record<string, typeof projects>,
    )

    const outputText = Object.entries(projectsByOrganizations)
      .map(([key, orgProjects]) => {
        const title = key === 'personal' ? 'Personal Projects' : `Organization ID: ${key}`
        return `${title}\nProjects:\n${orgProjects
          .map(
            (project) =>
              `  - Project ID: ${project.id}
      Name: ${project.displayName}
      Created At: ${project.createdAt}
      Members: ${project.members.length}
      Metadata: ${JSON.stringify(project.metadata)}`,
          )
          .join('\n\n')}`
      })
      .join('\n\n')

    return {
      content: [
        {
          type: 'text' as const,
          text: `Current Sanity Projects Grouped by Organization:\n\n${outputText}`,
        },
      ],
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error fetching Sanity projects: ${error.message}`,
        },
      ],
    }
  }
}
