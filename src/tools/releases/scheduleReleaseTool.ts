import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import {parseDateString} from '../../utils/dates.js'
import {ReleaseSchemas} from './common.js'

export const ScheduleReleaseToolParams = z.object({
  releaseId: ReleaseSchemas.releaseId,
  publishAt: ReleaseSchemas.publishDate,
})

type Params = z.infer<typeof ScheduleReleaseToolParams>

export async function scheduleReleaseTool(params: Params) {
  try {
    const {releaseId, publishAt} = params
    const parsedPublishAt = parseDateString(publishAt)

    const response = await sanityClient.request({
      uri: `/data/actions/${sanityClient.config().dataset}`,
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.schedule',
            releaseId,
            publishAt: parsedPublishAt,
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
            text: `Error scheduling release: ${response.error.description}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResponse(
            `Scheduled release '${releaseId}' for publishing at ${parsedPublishAt}`,
            {
              scheduled: {
                releaseId,
                publishAt: parsedPublishAt,
              },
            },
          ),
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
          text: `Error scheduling release: ${errorMessage}`,
        },
      ],
    }
  }
}
