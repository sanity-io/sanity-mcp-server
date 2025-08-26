import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'

export const UnarchiveReleaseToolParams = z.object({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof UnarchiveReleaseToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const {releaseId} = params
  const client = createToolClient(params, extra?.authInfo?.token)

  await client.action({
    actionType: `sanity.action.release.unarchive`,
    releaseId,
  })

  return createSuccessResponse(`Unarchived release '${releaseId}'`)
}

export const unarchiveReleaseTool = withErrorHandling(
  _tool,
  'Error performing unarchive release action',
)
