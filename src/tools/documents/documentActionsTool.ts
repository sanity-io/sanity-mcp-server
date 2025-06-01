import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'
import {getDraftId} from '@sanity/id-utils'

const PublishActionSchema = z.object({
  type: z.literal('publish'),
})

const UnpublishActionSchema = z.object({
  type: z.literal('unpublish'),
})

const DiscardVersionActionSchema = z.object({
  type: z.literal('version.discard'),
  releaseId: z.string().describe('ID of the release that contains this document version'),
})

const UnpublishVersionActionSchema = z.object({
  type: z.literal('version.unpublish'),
  releaseId: z.string().describe('ID of the release that contains this document version'),
})

const DeleteActionSchema = z.object({
  type: z.literal('delete'),
})

export const DocumentActionsToolParams = BaseToolSchema.extend({
  id: z.string().describe('ID of the published document'),
  action: z.discriminatedUnion('type', [
    PublishActionSchema,
    UnpublishActionSchema,
    DiscardVersionActionSchema,
    UnpublishVersionActionSchema,
    DeleteActionSchema,
  ]),
})

type Params = z.infer<typeof DocumentActionsToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = resolveDocumentId(params.id)
  const draftId = getDraftId(publishedId)

  switch (params.action.type) {
    case 'publish': {
      await client.action({
        actionType: 'sanity.action.document.publish',
        publishedId,
        draftId,
      })
      return createSuccessResponse(`Published document '${draftId}' to '${publishedId}'`)
    }

    case 'unpublish': {
      await client.action({
        actionType: 'sanity.action.document.unpublish',
        publishedId,
        draftId,
      })
      return createSuccessResponse(`Unpublished document '${params.id}' (moved to drafts)`)
    }

    case 'version.discard': {
      const versionId = resolveDocumentId(publishedId, params.action.releaseId)
      await client.action({
        actionType: 'sanity.action.document.version.discard',
        versionId,
      })
      return createSuccessResponse(`Discarded document '${versionId}'`)
    }

    case 'version.unpublish': {
      const versionId = resolveDocumentId(publishedId, params.action.releaseId)
      await client.action({
        actionType: 'sanity.action.document.version.unpublish',
        publishedId,
        versionId,
      })
      return createSuccessResponse(
        `Document '${publishedId}' will be unpublished when release '${params.action.releaseId}' is run`,
      )
    }

    case 'delete': {
      await client.action({
        actionType: 'sanity.action.document.delete',
        publishedId,
        includeDrafts: [draftId],
      })
      return createSuccessResponse(`Deleted document '${params.id}' and all its drafts`)
    }
  }
}

export const documentActionsTool = withErrorHandling(tool, 'Error performing document action')
