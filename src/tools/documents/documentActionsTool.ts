import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'

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

  // For publish actions
  versionId: z
    .string()
    .optional()
    .describe('ID of the draft document to publish (with drafts. prefix)'),
})

type Params = z.infer<typeof DocumentActionsToolParams>

async function tool(params: Params) {
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
    return createErrorResponse(response.error.description)
  }

  const actionDescriptionMap = {
    delete: `Deleted document '${params.publishedId}' and all its drafts`,
    publish: `Published document '${params.versionId || `drafts.${params.publishedId}`}' to '${params.publishedId}'`,
    unpublish: `Unpublished document '${params.publishedId}' (moved to drafts)`,
  }

  return createSuccessResponse(actionDescriptionMap[actionType])
}

export const documentActionsTool = withErrorHandling(tool, 'Error performing document action')
