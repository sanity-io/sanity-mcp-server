import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import type {SanityApplication} from '../../types/sanity.js'

export const GetProjectStudiosToolParams = z.object({
  projectId: z.string().describe('Project id for the sanity project'),
})

type Params = z.infer<typeof GetProjectStudiosToolParams>

export async function getProjectStudiosTool(args: Params) {
  try {
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

    const message = formatResponse(`Found ${studios.length} studios for project "${projectId}"`, {
      studiosList,
    })

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
        },
      ],
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error fetching studios: ${errorMessage}`,
        },
      ],
    }
  }
}
