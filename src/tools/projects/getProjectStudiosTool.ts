import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {SanityApplication} from '../../types/sanity.js'
import {createToolClient} from '../../utils/tools.js'
import {pluralize} from '../../utils/formatters.js'

export const GetProjectStudiosToolParams = z.object({
  resource: z.object({
    projectId: z.string().describe('ID of the Sanity project'),
  }),
})

type Params = z.infer<typeof GetProjectStudiosToolParams>

async function _tool(args: Params) {
  const client = createToolClient(args)
  const projectId = client.config().projectId

  if (!projectId) {
    throw new Error('A project id is required')
  }

  const applications = await client.request<SanityApplication[]>({
    uri: `/projects/${projectId}/user-applications`,
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

  return createSuccessResponse(
    `Found ${studios.length} ${pluralize(studios, 'studio')} for project "${projectId}"`,
    {
      studiosList,
    },
  )
}

export const getProjectStudiosTool = withErrorHandling(_tool, 'Error fetching studios')
