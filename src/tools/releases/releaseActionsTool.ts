import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
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

export async function releaseActionsTool(params: Params) {
  try {
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
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error performing release action: ${response.error.description}`,
          },
        ],
      }
    }

    const actionDescriptionMap = {
      publish: `Published all documents in release '${releaseId}'`,
      archive: `Archived release '${releaseId}'`,
      unarchive: `Unarchived release '${releaseId}'`,
      unschedule: `Unscheduled release '${releaseId}'`,
      delete: `Permanently deleted release '${releaseId}'`,
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
          text: `Error performing release action: ${errorMessage}`,
        },
      ],
    }
  }
}
