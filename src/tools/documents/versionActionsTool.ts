import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const VersionActionTypes = z.enum(['create', 'discard', 'replace', 'unpublish'])

export const VersionActionsToolParams = z.object({
  actionType: VersionActionTypes.describe('Type of version action to perform'),

  // For all actions except replace
  publishedId: z
    .string()
    .optional()
    .describe('ID of the published document (without version prefix)'),

  // For create and replace actions
  document: z
    .record(z.any())
    .optional()
    .describe('Document to create or replace (must include _id and _type)'),

  // For discard actions
  versionId: z.string().optional().describe('ID of the version document to discard'),
})

type Params = z.infer<typeof VersionActionsToolParams>

export async function versionActionsTool(params: Params) {
  try {
    const {actionType, ...rest} = params

    const response = await sanityClient.request({
      uri: `/data/actions/${sanityClient.config().dataset}`,
      method: 'POST',
      body: {
        actions: [
          {
            actionType: `sanity.action.document.version.${actionType}`,
            ...rest,
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
            text: `Error performing version action: ${response.error.description}`,
          },
        ],
      }
    }

    const actionDescriptionMap = {
      create: `Created new version document '${params.document?._id}' for '${params.publishedId}'`,
      discard: `Discarded version document '${params.versionId}'`,
      replace: `Replaced version document '${params.document?._id}'`,
      unpublish: `Marked version '${params.versionId}' to unpublish document '${params.publishedId}' when released`,
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResponse(actionDescriptionMap[actionType]),
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
          text: `Error performing version action: ${errorMessage}`,
        },
      ],
    }
  }
}
