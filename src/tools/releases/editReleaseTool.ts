import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import {parseDateString} from '../../utils/dates.js'
import {ReleaseSchemas} from './schemas.js'

export const EditReleaseToolParams = z.object({
  releaseId: ReleaseSchemas.releaseId,
  title: ReleaseSchemas.title.optional(),
  description: ReleaseSchemas.description.optional(),
  releaseType: ReleaseSchemas.releaseType.optional(),
  intendedPublishAt: ReleaseSchemas.publishDate
    .optional()
    .describe('When the release is intended to be published (informational only)'),
})
type Params = z.infer<typeof EditReleaseToolParams>

export async function editReleaseTool(params: Params) {
  try {
    const metadataChanges = {} as Record<string, unknown>
    if (params.title) metadataChanges.title = params.title
    if (params.description) metadataChanges.description = params.description
    if (params.releaseType) metadataChanges.releaseType = params.releaseType

    if (params.intendedPublishAt) {
      metadataChanges.intendedPublishAt = parseDateString(params.intendedPublishAt)
    }

    // Only proceed if there are changes to make
    if (Object.keys(metadataChanges).length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No changes provided for the release metadata.',
          },
        ],
      }
    }

    const response = await sanityClient.request({
      uri: `/data/actions/${sanityClient.config().dataset}`,
      method: 'POST',
      body: {
        actions: [
          {
            actionType: 'sanity.action.release.edit',
            releaseId: params.releaseId,
            patch: {
              set: {
                metadata: metadataChanges,
              },
            },
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
            text: `Error editing release: ${response.error.description}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResponse(`Updated metadata for release '${params.releaseId}'`, {
            updated: {
              releaseId: params.releaseId,
              changes: metadataChanges,
            },
          }),
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
          text: `Error editing release: ${errorMessage}`,
        },
      ],
    }
  }
}
