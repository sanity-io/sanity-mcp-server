import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {type DocumentId, getPublishedId, getVersionId} from '@sanity/id-utils'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const MarkVersionForUnpublishParams = BaseToolSchema.extend({
  documentId: z.string().describe('ID of the document to mark for unpublishing'),
  releaseId: z.string().describe('ID of the release to associate with this unpublish action'),
})

type Params = z.infer<typeof MarkVersionForUnpublishParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = getPublishedId(params.documentId as DocumentId)
  const versionId = getVersionId(publishedId, params.releaseId)
  const dataset = client.config().dataset

  if (!dataset) {
    throw new Error('A dataset resource is required')
  }

  const response = await client.request({
    uri: `/data/actions/${dataset}`,
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
    throw new Error(response.error.description)
  }

  return createSuccessResponse(
    `Document '${publishedId}' marked for unpublishing when release '${params.releaseId}' is published`,
  )
}

export const markVersionForUnpublishTool = withErrorHandling(
  tool,
  'Error marking version for unpublish',
)
