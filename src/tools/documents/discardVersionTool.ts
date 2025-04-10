import {z} from 'zod'
import {VersionId} from '@sanity/id-utils'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const DiscardVersionToolParams = z.object({
  versionId: z
    .string()
    .describe('ID of the version document to discard (with versions.releaseId prefix)'),
})

type Params = z.infer<typeof DiscardVersionToolParams>

export async function discardVersionTool(params: Params) {
  try {
    const versionId = VersionId(params.versionId)
    const response = await sanityClient.request({
      uri: `/data/actions/${sanityClient.config().dataset}`,
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.document.version.discard',
            versionId,
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
            text: `Error discarding version: ${response.error.description}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResponse(`Successfully discarded version document '${versionId}'`),
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
          text: `Error discarding version: ${errorMessage}`,
        },
      ],
    }
  }
}
