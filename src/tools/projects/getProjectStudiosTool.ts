import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {SanityApplication} from '../../types/sanity.js'

export const GetProjectStudiosToolParams = z.object({
  projectId: z.string().describe('Project id for the sanity project'),
})

type Params = z.infer<typeof GetProjectStudiosToolParams>

async function tool(args: Params) {
  const projectId = args.projectId

  const applications = await sanityClient.request<SanityApplication[]>({
    uri: `/v2024-08-01/projects/${projectId}/user-applications`,
  })

  const studios = applications.filter((app) => app.type === 'studio')

  if (studios.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No studio applications found for this project. Studio may be local only.',
        },
      ],
    }
  }

  const studiosList: Record<string, object> = {}

  for (const studio of studios) {
    studiosList[studio.id] = {
      url: studio.appHost,
      title: studio.title || 'Untitled Studio',
      createdAt: studio.createdAt,
    }
  }

  return createSuccessResponse(`Found ${studios.length} studios for project "${projectId}"`, {
    studiosList,
  })
}

export const getProjectStudiosTool = withErrorHandling(tool, 'Error fetching studios')
