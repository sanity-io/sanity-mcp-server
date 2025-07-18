import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'
import {getDraftId} from '@sanity/id-utils'

export const UnpublishDocumentToolParams = BaseToolSchema.extend({
  id: z.string().describe('ID of the published document'),
})

type Params = z.infer<typeof UnpublishDocumentToolParams>

async function _tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = resolveDocumentId(params.id, false)
  const draftId = getDraftId(publishedId)

  await client.action({
    actionType: 'sanity.action.document.unpublish',
    publishedId,
    draftId,
  })
  return createSuccessResponse(`Unpublished document '${params.id}' (moved to drafts)`)
}

export const unpublishDocumentTool = withErrorHandling(_tool, 'Error performing unpublish document action')
