import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

/* Create and update are defined as separate tools */
export const DocumentActionTypes = z.enum(['publish', 'unpublish', 'delete'])

export const DocumentActionsToolParams = z.object({
  actionType: DocumentActionTypes.describe('Type of document action to perform'),

  // Required for all actions
  publishedId: z.string().describe('ID of the published document (without drafts. prefix)'),

  // For delete actions
  includeDrafts: z
    .array(z.string())
    .optional()
    .describe('Array of draft document IDs to include in deletion'),
  purge: z.boolean().optional().describe('Whether to completely purge document history'),

  // For publish actions
  versionId: z
    .string()
    .optional()
    .describe('ID of the draft document to publish (with drafts. prefix)'),
})

type Params = z.infer<typeof DocumentActionsToolParams>

export async function documentActionsTool(params: Params) {
  try {
    const {actionType, ...rest} = params

    const response = await sanityClient.request({
      uri: `/data/actions/${sanityClient.config().dataset}`,
      method: 'POST',
      body: {
        actions: [
          {
            actionType: `sanity.action.document.${actionType}`,
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
            text: `Error performing document action: ${response.error.description}`,
          },
        ],
      }
    }

    const actionDescriptionMap = {
      delete: `Deleted document '${params.publishedId}' and all its drafts`,
      publish: `Published document '${params.versionId || `drafts.${params.publishedId}`}' to '${params.publishedId}'`,
      unpublish: `Unpublished document '${params.publishedId}' (moved to drafts)`,
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
          text: `Error performing document action: ${errorMessage}`,
        },
      ],
    }
  }
}
