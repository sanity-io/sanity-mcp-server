import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import {type DocumentId, getPublishedId} from '@sanity/id-utils'

export const MarkVersionForUnpublishParams = z.object({
  documentId: z.string().describe('ID of the document to mark for unpublishing'),
  releaseId: z.string().describe('ID of the release to associate with this unpublish action'),
})

type Params = z.infer<typeof MarkVersionForUnpublishParams>

export async function markVersionForUnpublishTool(params: Params) {
  try {
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
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error marking version for unpublish: ${response.error.description}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResponse(
            `Document '${publishedId}' marked for unpublishing when release '${params.releaseId}' is published`,
          ),
        },
      ],
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error marking version for unpublish: ${errorMessage}`,
        },
      ],
    }
  }
}
