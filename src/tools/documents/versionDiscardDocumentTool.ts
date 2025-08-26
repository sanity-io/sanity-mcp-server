import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'

export const VersionDiscardDocumentToolParams = z.object({
  id: z.string().describe('ID of the published document'),
  releaseId: z.string().describe('ID of the release that contains this document version'),
})

type Params = z.infer<typeof VersionDiscardDocumentToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const publishedId = resolveDocumentId(params.id, false)

  const versionId = resolveDocumentId(publishedId, params.releaseId)
  await client.action({
    actionType: 'sanity.action.document.version.discard',
    versionId,
  })
  return createSuccessResponse(`Discarded document '${versionId}'`)
}

export const versionDiscardDocumentTool = withErrorHandling(_tool, 'Error performing version discard document action')
