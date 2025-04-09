import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import {parseDateString} from '../../utils/dates.js'
import {generateSanityId} from '../../utils/id.js'
import {ReleaseSchemas} from './schemas.js'

export const CreateReleaseToolParams = z.object({
  title: ReleaseSchemas.title,
  description: ReleaseSchemas.description.optional(),
  releaseType: ReleaseSchemas.releaseType.optional(),
  intendedPublishAt: ReleaseSchemas.publishDate.optional(),
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
