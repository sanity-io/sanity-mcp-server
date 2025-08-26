import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'

export const PublishReleaseToolParams = z.object({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof PublishReleaseToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const {releaseId} = params
  const client = createToolClient(params, extra?.authInfo?.token)

  await client.action({
    actionType: `sanity.action.release.publish`,
    releaseId,
  })

  return createSuccessResponse(`Published all documents in release '${releaseId}'`)
}

export const publishReleaseTool = withErrorHandling(_tool, 'Error performing publish release action')
