import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'

export const VersionDiscardDocumentToolParams = BaseToolSchema.extend({
  id: z.string().describe('ID of the published document'),
  releaseId: z.string().describe('ID of the release that contains this document version'),
})

type Params = z.infer<typeof VersionDiscardDocumentToolParams>

async function _tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = resolveDocumentId(params.id, false)

  const versionId = resolveDocumentId(publishedId, params.releaseId)
  await client.action({
    actionType: 'sanity.action.document.version.discard',
    versionId,
  })
  return createSuccessResponse(`Discarded document '${versionId}'`)
}

export const versionDiscardDocumentTool = withErrorHandling(_tool, 'Error performing version discard document action')
