import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'

export const VersionReplaceDocumentToolParams = z.object({
  id: z.string().describe('ID of the published document'),
  type: z.literal('version.replace'),
  releaseId: z.string().describe('ID of the release that contains this document version'),
  sourceDocumentId: z.string().describe('ID of the document to copy contents from'),
})

type Params = z.infer<typeof VersionReplaceDocumentToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const publishedId = resolveDocumentId(params.id, false)

  const versionId = resolveDocumentId(publishedId, params.releaseId)
  const sourceDocument = await client.getDocument(params.sourceDocumentId)

  if (!sourceDocument) {
    throw new Error(`Source document '${params.sourceDocumentId}' not found`)
  }

  await client.action({
    actionType: 'sanity.action.document.version.replace',
    document: {
      ...sourceDocument,
      _id: versionId,
    },
  })
  return createSuccessResponse(
    `Replaced document version '${versionId}' with contents from '${sourceDocument._id}'`,
  )
}

export const versionReplaceDocumentTool = withErrorHandling(
  _tool,
  'Error performing version replace document action',
)
