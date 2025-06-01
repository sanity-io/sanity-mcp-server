import type {z} from 'zod'
import {parseDateString} from '../../utils/dates.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const EditReleaseToolParams = BaseToolSchema.extend({
  releaseId: ReleaseSchemas.releaseId,
  title: ReleaseSchemas.title.optional(),
  description: ReleaseSchemas.description.optional(),
  releaseType: ReleaseSchemas.releaseType.optional(),
  intendedPublishAt: ReleaseSchemas.publishDate
    .optional()
    .describe('When the release is intended to be published (informational only)'),
})
type Params = z.infer<typeof EditReleaseToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const metadataChanges = {} as Record<string, unknown>
  if (params.title) metadataChanges.title = params.title
  if (params.description) metadataChanges.description = params.description
  if (params.releaseType) metadataChanges.releaseType = params.releaseType

  if (params.intendedPublishAt) {
    metadataChanges.intendedPublishAt = parseDateString(params.intendedPublishAt)
  }

  if (Object.keys(metadataChanges).length === 0) {
    throw new Error('No changes provided for the release metadata.')
  }

  await client.action({
    actionType: 'sanity.action.release.edit',
    releaseId: params.releaseId,
    patch: {
      set: {
        metadata: metadataChanges,
      },
    },
  })

  return createSuccessResponse(`Updated metadata for release '${params.releaseId}'`, {
    updated: {
      releaseId: params.releaseId,
      changes: metadataChanges,
    },
  })
}

export const editReleaseTool = withErrorHandling(tool, 'Error editing release')
