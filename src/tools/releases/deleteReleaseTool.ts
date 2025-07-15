import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const DeleteReleaseToolParams = BaseToolSchema.extend({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof DeleteReleaseToolParams>

async function _tool(params: Params) {
  const {releaseId} = params
  const client = createToolClient(params)

  await client.action({
    actionType: `sanity.action.release.delete`,
    releaseId,
  })

  return createSuccessResponse(`Permanently deleted release '${releaseId}'`)
}

export const deleteReleaseTool = withErrorHandling(_tool, 'Error performing delete release action')
