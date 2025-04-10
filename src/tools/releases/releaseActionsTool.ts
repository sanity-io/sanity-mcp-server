import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'

/* Create, edit and schedule are defined as separate tools */
export const ReleaseActionTypes = z.enum([
  'publish',
  'archive',
  'unarchive',
  'unschedule',
  'delete',
])

export const ReleaseActionsToolParams = z.object({
  actionType: ReleaseActionTypes.describe('Type of release action to perform'),
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof ReleaseActionsToolParams>

async function tool(params: Params) {
  const {actionType, releaseId} = params

  const response = await sanityClient.request({
    uri: `/data/actions/${sanityClient.config().dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: `sanity.action.release.${actionType}`,
          releaseId,
        },
      ],
    },
  })

  if (response.error) {
    return createErrorResponse(response.error.description)
  }

  const actionDescriptionMap = {
    publish: `Published all documents in release '${releaseId}'`,
    archive: `Archived release '${releaseId}'`,
    unarchive: `Unarchived release '${releaseId}'`,
    unschedule: `Unscheduled release '${releaseId}'`,
    delete: `Permanently deleted release '${releaseId}'`,
  }

  return createSuccessResponse(actionDescriptionMap[actionType])
}

export const releaseActionsTool = withErrorHandling(tool, 'Error performing release action')
