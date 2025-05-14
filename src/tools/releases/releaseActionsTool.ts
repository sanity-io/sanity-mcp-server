import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

/* Create, edit and schedule are defined as separate tools */
export const ReleaseActionTypes = z.enum([
  'publish',
  'archive',
  'unarchive',
  'unschedule',
  'delete',
])

export const ReleaseActionsToolParams = BaseToolSchema.extend({
  actionType: ReleaseActionTypes.describe('Type of release action to perform'),
  releaseId: ReleaseSchemas.releaseId,
})

type Params = z.infer<typeof ReleaseActionsToolParams>

async function tool(params: Params) {
  const {actionType, releaseId} = params
  const client = createToolClient(params)
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
          actionType: `sanity.action.release.${actionType}`,
          releaseId,
        },
      ],
    },
  })

  if (response.error) {
    throw new Error(response.error.description)
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
