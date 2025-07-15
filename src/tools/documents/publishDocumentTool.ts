import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'
import {getDraftId} from '@sanity/id-utils'

export const PublishDocumentToolParams = BaseToolSchema.extend({
  id: z.string().describe('ID of the published document'),
})

type Params = z.infer<typeof PublishDocumentToolParams>

async function _tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = resolveDocumentId(params.id, false)
  const draftId = getDraftId(publishedId)

  await client.action({
    actionType: 'sanity.action.document.publish',
    publishedId,
    draftId,
  })
  return createSuccessResponse(`Published document '${draftId}' to '${publishedId}'`)
}

export const publishDocumentTool = withErrorHandling(_tool, 'Error performing publish document action')
