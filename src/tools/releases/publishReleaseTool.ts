import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const PublishReleaseToolParams = BaseToolSchema.extend({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof PublishReleaseToolParams>

async function _tool(params: Params) {
  const {releaseId} = params
  const client = createToolClient(params)

  await client.action({
    actionType: `sanity.action.release.publish`,
    releaseId,
  })

  return createSuccessResponse(`Published all documents in release '${releaseId}'`)
}

export const publishReleaseTool = withErrorHandling(_tool, 'Error performing publish release action')
