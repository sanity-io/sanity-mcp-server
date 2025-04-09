import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const ReleaseActionTypes = z.enum([
  'edit',
  'publish',
  'archive',
  'unarchive',
  'schedule',
  'unschedule',
  'delete',
])

export const ReleaseActionsToolParams = z.object({
  actionType: ReleaseActionTypes.describe('Type of release action to perform'),

  releaseId: z.string().describe('ID of the release'),

  // For edit action
  patch: z.record(z.any()).optional().describe('Patch to apply to the release metadata'),

  // For schedule action
  publishAt: z
    .string()
    .optional()
    .describe('When to publish the release in ISO format (e.g. 2024-09-23T10:12:00Z)'),
})

type Params = z.infer<typeof ReleaseActionsToolParams>

export async function releaseActionsTool(params: Params) {
  try {
    const {actionType, ...rest} = params

    const response = await sanityClient.request({
      uri: `/v2024-05-23/data/actions/${sanityClient.config().dataset}`,
      method: 'POST',
      body: {
        actions: [
          {
            actionType: `sanity.action.release.${actionType}`,
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
            text: `Error performing release action: ${response.error.description}`,
          },
        ],
      }
    }

    const actionDescriptionMap = {
      edit: `Updated metadata for release '${params.releaseId}'`,
      publish: `Published all documents in release '${params.releaseId}'`,
      archive: `Archived release '${params.releaseId}'`,
      unarchive: `Unarchived release '${params.releaseId}'`,
      schedule: `Scheduled release '${params.releaseId}' for publishing at ${params.publishAt}`,
      unschedule: `Unscheduled release '${params.releaseId}'`,
      delete: `Permanently deleted release '${params.releaseId}'`,
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
