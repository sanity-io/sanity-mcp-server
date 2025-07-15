import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'

export const VersionUnpublishDocumentToolParams = BaseToolSchema.extend({
  id: z.string().describe('ID of the published document'),
  releaseId: z.string().describe('ID of the release that contains this document version'),
})

type Params = z.infer<typeof VersionUnpublishDocumentToolParams>

async function _tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = resolveDocumentId(params.id, false)

  const versionId = resolveDocumentId(publishedId, params.releaseId)
  await client.action({
    actionType: 'sanity.action.document.version.unpublish',
    publishedId,
    versionId,
  })
  return createSuccessResponse(
    `Document '${publishedId}' will be unpublished when release '${params.releaseId}' is run`,
  )
}

export const versionUnpublishDocumentTool = withErrorHandling(_tool, 'Error performing version unpublish document action')
