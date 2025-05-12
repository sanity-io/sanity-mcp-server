import {z} from 'zod'
import {parseDateString} from '../../utils/dates.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const ScheduleReleaseToolParams = z
  .object({
    releaseId: ReleaseSchemas.releaseId,
    publishAt: ReleaseSchemas.publishDate,
  })
  .merge(BaseToolSchema)

type Params = z.infer<typeof ScheduleReleaseToolParams>

async function tool(params: Params) {
  const {releaseId, publishAt} = params
  const parsedPublishAt = parseDateString(publishAt)
  const client = createToolClient(params)
  const dataset = client.config().dataset

  if (!dataset) {
    throw new Error('A dataset resrouce is required')
  }

  const response = await client.request({
    uri: `/data/actions/${dataset}`,
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
    throw new Error(response.error.description)
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
