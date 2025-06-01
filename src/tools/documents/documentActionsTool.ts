import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {resolveDocumentId} from '../../utils/resolvers.js'
import {getDraftId} from '@sanity/id-utils'

const PublishActionSchema = z
  .object({
    type: z.literal('publish'),
  })
  .describe('Publish a draft document to make it live')

const UnpublishActionSchema = z
  .object({
    type: z.literal('unpublish'),
  })
  .describe('Unpublish a published document (moves it back to drafts)')

const ReplaceVersionActionSchema = z
  .object({
    type: z.literal('version.replace'),
    releaseId: z.string().describe('ID of the release that contains this document version'),
    sourceDocumentId: z.string().describe('ID of the document to copy contents from'),
  })
  .describe('Replace the contents of a document version with contents from another document')

const DiscardVersionActionSchema = z
  .object({
    type: z.literal('version.discard'),
    releaseId: z.string().describe('ID of the release that contains this document version'),
  })
  .describe('Discard a document version from a release (removes it from the release)')

const UnpublishVersionActionSchema = z
  .object({
    type: z.literal('version.unpublish'),
    releaseId: z.string().describe('ID of the release that contains this document version'),
  })
  .describe('Mark a document to be unpublished when the release is run')

const DeleteActionSchema = z
  .object({
    type: z.literal('delete'),
  })
  .describe('Permanently delete a document and all its drafts')

export const DocumentActionsToolParams = BaseToolSchema.extend({
  id: z.string().describe('ID of the published document'),
  action: z
    .discriminatedUnion('type', [
      PublishActionSchema,
      UnpublishActionSchema,
      DiscardVersionActionSchema,
      ReplaceVersionActionSchema,
      UnpublishVersionActionSchema,
      DeleteActionSchema,
    ])
    .describe('Type of action to perform on the document'),
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

    case 'version.replace': {
      const versionId = resolveDocumentId(publishedId, params.action.releaseId)
      const sourceDocument = await client.getDocument(params.action.sourceDocumentId)

      if (!sourceDocument) {
        throw new Error(`Source document '${params.action.sourceDocumentId}' not found`)
      }

      await client.action({
        actionType: 'sanity.action.document.version.replace',
        document: {
          ...sourceDocument,
          _id: versionId,
        },
      })
      return createSuccessResponse(
        `Replaced document version '${versionId}' with contents from '${params.action.id}'`,
      )
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
