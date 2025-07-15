import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const UnachiveReleaseToolParams = BaseToolSchema.extend({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof UnachiveReleaseToolParams>

async function _tool(params: Params) {
  const {releaseId} = params
  const client = createToolClient(params)

  await client.action({
    actionType: `sanity.action.release.unarchive`,
    releaseId,
  })

  return createSuccessResponse(`Unarchived release '${releaseId}'`)
}

export const unarchiveReleaseTool = withErrorHandling(_tool, 'Error performing unarchive release action')
