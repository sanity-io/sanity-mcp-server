import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const UnscheduleReleaseToolParams = BaseToolSchema.extend({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof UnscheduleReleaseToolParams>

async function _tool(params: Params) {
  const {releaseId} = params
  const client = createToolClient(params)

  await client.action({
    actionType: `sanity.action.release.unschedule`,
    releaseId,
  })

  return createSuccessResponse(`Unscheduled release '${releaseId}'`)
}

export const unscheduleReleaseTool = withErrorHandling(_tool, 'Error performing unschedule release action')
