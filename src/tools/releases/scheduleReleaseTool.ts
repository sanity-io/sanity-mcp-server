import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {parseDateString} from '../../utils/dates.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'

export const ScheduleReleaseToolParams = z.object({
  releaseId: ReleaseSchemas.releaseId,
  publishAt: ReleaseSchemas.publishDate,
})

type Params = z.infer<typeof ScheduleReleaseToolParams>

async function tool(params: Params) {
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
    return createErrorResponse(response.error.description)
  }

  return createSuccessResponse(
    `Scheduled release '${releaseId}' for publishing at ${parsedPublishAt}`,
    {
      scheduled: {
        releaseId,
        publishAt: parsedPublishAt,
      },
    },
  )
}

export const scheduleReleaseTool = withErrorHandling(tool, 'Error scheduling release')
