import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'
import {getDraftId} from '@sanity/id-utils'

export const PublishDocumentToolParams = z.object({
  id: z.string().describe('ID of the published document'),
})

type Params = z.infer<typeof PublishDocumentToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const publishedId = resolveDocumentId(params.id, false)
  const draftId = getDraftId(publishedId)

  await client.action({
    actionType: 'sanity.action.document.publish',
    publishedId,
    draftId,
  })
  return createSuccessResponse(`Published document '${draftId}' to '${publishedId}'`)
}

export const publishDocumentTool = withErrorHandling(
  _tool,
  'Error performing publish document action',
)
