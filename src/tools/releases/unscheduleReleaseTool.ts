import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'

export const UnscheduleReleaseToolParams = z.object({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof UnscheduleReleaseToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const {releaseId} = params
  const client = createToolClient(params, extra?.authInfo?.token)

  await client.action({
    actionType: `sanity.action.release.unschedule`,
    releaseId,
  })

  return createSuccessResponse(`Unscheduled release '${releaseId}'`)
}

export const unscheduleReleaseTool = withErrorHandling(
  _tool,
  'Error performing unschedule release action',
)
