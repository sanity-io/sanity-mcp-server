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

async function _tool(params: Params) {
  const {actionType, releaseId} = params
  const client = createToolClient(params)

  await client.action({
    actionType: `sanity.action.release.${actionType}`,
    releaseId,
  })

  const actionDescriptionMap = {
    publish: `Published all documents in release '${releaseId}'`,
    archive: `Archived release '${releaseId}'`,
    unarchive: `Unarchived release '${releaseId}'`,
    unschedule: `Unscheduled release '${releaseId}'`,
    delete: `Permanently deleted release '${releaseId}'`,
  }

  return createSuccessResponse(actionDescriptionMap[actionType])
}

export const releaseActionsTool = withErrorHandling(_tool, 'Error performing release action')
