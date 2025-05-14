import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {type DocumentId, DraftId, isVersionId, VersionId} from '@sanity/id-utils'

export const DiscardVersionToolParams = BaseToolSchema.extend({
  versionId: z
    .string()
    .describe(
      'ID of the version document to discard (with versions.releaseId prefix or a draft ID)',
    ),
})

type Params = z.infer<typeof DiscardVersionToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const versionId = isVersionId(params.versionId as DocumentId)
    ? VersionId(params.versionId)
    : DraftId(params.versionId)
  const dataset = client.config().dataset

  if (!dataset) {
    throw new Error('A dataset resrouce is required')
  }

  const response = await client.request({
    uri: `/data/actions/${dataset}`,
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
    throw new Error(response.error.description)
  }

  return createSuccessResponse(`Successfully discarded version document '${versionId}'`)
}

export const discardVersionTool = withErrorHandling(tool, 'Error discarding version')
