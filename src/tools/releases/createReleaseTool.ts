import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import {parseDateString} from '../../utils/dates.js'
import {generateSanityId} from '../../utils/id.js'

export const CreateReleaseToolParams = z.object({
  title: z.string().describe('Title for the release (e.g., "Spring 2025 Product Launch")'),

  description: z.string().optional().describe('Description for the release'),

  releaseType: z
    .enum(['asap', 'undecided', 'scheduled'])
    .optional()
    .describe('Type of release (asap, undecided, scheduled)'),

  intendedPublishAt: z
    .string()
    .optional()
    .describe(
      'When to publish. Can be ISO date (2025-04-04T18:36:00.000Z) or natural language like "in two weeks"',
    ),
})

type Params = z.infer<typeof CreateReleaseToolParams>

export async function createReleaseTool(params: Params) {
  try {
    const releaseId = generateSanityId(8, 'r')
    const intendedPublishAt = parseDateString(params.intendedPublishAt)

    const response = await sanityClient.request({
      uri: `/data/actions/${sanityClient.config().dataset}`,
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.create',
            releaseId,
            metadata: {
              title: params.title,
              description: params.description,
              releaseType: params.releaseType,
              intendedPublishAt,
            },
          },
        ],
      },
    })

    if (response.error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error creating release: ${response.error.description}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResponse(`Created new release with ID "${releaseId}"`, {
            release: {
              releaseId,
              title: params.title,
              description: params.description,
              releaseType: params.releaseType,
              intendedPublishAt,
            },
          }),
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
          text: `Error creating release: ${errorMessage}`,
        },
      ],
    }
  }
}
