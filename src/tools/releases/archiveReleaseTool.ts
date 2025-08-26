import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'

export const ArchiveReleaseToolParams = z.object({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof ArchiveReleaseToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const {releaseId} = params
  const client = createToolClient(params, extra?.authInfo?.token)

  await client.action({
    actionType: `sanity.action.release.archive`,
    releaseId,
  })

  return createSuccessResponse(`Archived release '${releaseId}'`)
}

export const archiveReleaseTool = withErrorHandling(
  _tool,
  'Error performing archive release action',
)
