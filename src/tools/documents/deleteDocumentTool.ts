import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'
import {getDraftId} from '@sanity/id-utils'

export const DeleteDocumentToolParams = z.object({
  id: z.string().describe('ID of the published document'),
})

type Params = z.infer<typeof DeleteDocumentToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const publishedId = resolveDocumentId(params.id, false)
  const draftId = getDraftId(publishedId)

  await client.action({
    actionType: 'sanity.action.document.delete',
    publishedId,
    includeDrafts: [draftId],
  })
  return createSuccessResponse(`Deleted document '${params.id}' and all its drafts`)
}

export const deleteDocumentTool = withErrorHandling(
  _tool,
  'Error performing delete document action',
)
