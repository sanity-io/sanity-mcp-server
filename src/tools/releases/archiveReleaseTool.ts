import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const ArchiveReleaseToolParams = BaseToolSchema.extend({
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof ArchiveReleaseToolParams>

async function _tool(params: Params) {
  const {releaseId} = params
  const client = createToolClient(params)

  await client.action({
    actionType: `sanity.action.release.archive`,
    releaseId,
  })

  return createSuccessResponse(`Archived release '${releaseId}'`)
}

export const archiveReleaseTool = withErrorHandling(_tool, 'Error performing archive release action')
