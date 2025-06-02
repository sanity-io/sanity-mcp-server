import type {z} from 'zod'
import {parseDateString} from '../../utils/dates.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const ScheduleReleaseToolParams = BaseToolSchema.extend({
  releaseId: ReleaseSchemas.releaseId,
  publishAt: ReleaseSchemas.publishDate,
})

type Params = z.infer<typeof ScheduleReleaseToolParams>

async function tool(params: Params) {
  const {releaseId, publishAt} = params
  const parsedPublishAt = parseDateString(publishAt)
  const client = createToolClient(params)

  if (!parsedPublishAt) {
    throw new Error('Invalid publishAt date provided')
  }

  await client.action({
    actionType: 'sanity.action.release.schedule',
    releaseId,
    publishAt: parsedPublishAt,
  })

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
