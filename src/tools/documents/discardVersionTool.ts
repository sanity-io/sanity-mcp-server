import {z} from 'zod'
import {isVersionId, VersionId, DraftId, type DocumentId} from '@sanity/id-utils'
import {sanityClient} from '../../config/sanity.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'

export const DiscardVersionToolParams = z.object({
  versionId: z
    .string()
    .describe(
      'ID of the version document to discard (with versions.releaseId prefix or a draft ID)',
    ),
})

type Params = z.infer<typeof DiscardVersionToolParams>

async function tool(params: Params) {
  const versionId = isVersionId(params.versionId as DocumentId)
    ? VersionId(params.versionId)
    : DraftId(params.versionId)

  const response = await sanityClient.request({
    uri: `/data/actions/${sanityClient.config().dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.document.version.discard',
          versionId: versionId,
        },
      ],
    },
  })

  if (response.error) {
    return createErrorResponse(response.error.description)
  }

  return createSuccessResponse(`Successfully discarded version document '${versionId}'`)
}

export const discardVersionTool = withErrorHandling(tool, 'Error discarding version')
