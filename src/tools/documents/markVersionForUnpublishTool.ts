import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {type DocumentId, getPublishedId} from '@sanity/id-utils'

export const MarkVersionForUnpublishParams = z.object({
  documentId: z.string().describe('ID of the document to mark for unpublishing'),
  releaseId: z.string().describe('ID of the release to associate with this unpublish action'),
})

type Params = z.infer<typeof MarkVersionForUnpublishParams>

async function tool(params: Params) {
  const publishedId = getPublishedId(params.documentId as DocumentId)
  const versionId = `versions.${params.releaseId}.${publishedId}`

  const response = await sanityClient.request({
    uri: `/data/actions/${sanityClient.config().dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.document.version.unpublish',
          versionId: versionId,
          publishedId: publishedId,
        },
      ],
    },
  })

  if (response.error) {
    return createErrorResponse(response.error.description)
  }

  return createSuccessResponse(
    `Document '${publishedId}' marked for unpublishing when release '${params.releaseId}' is published`,
  )
}

export const markVersionForUnpublishTool = withErrorHandling(
  tool,
  'Error marking version for unpublish',
)
