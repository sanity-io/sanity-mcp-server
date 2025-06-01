import type {z} from 'zod'
import {parseDateString} from '../../utils/dates.js'
import {generateSanityId} from '../../utils/id.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const CreateReleaseToolParams = BaseToolSchema.extend({
  title: ReleaseSchemas.title,
  description: ReleaseSchemas.description.optional(),
  releaseType: ReleaseSchemas.releaseType.optional(),
  intendedPublishAt: ReleaseSchemas.publishDate.optional(),
})

type Params = z.infer<typeof CreateReleaseToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const releaseId = generateSanityId(8, 'r')
  const intendedPublishAt = parseDateString(params.intendedPublishAt)

  await client.action({
    actionType: 'sanity.action.release.create',
    releaseId,
    metadata: {
      title: params.title,
      description: params.description,
      releaseType: params.releaseType,
      ...(intendedPublishAt && { intendedPublishAt }),
    },
  })

  return createSuccessResponse(`Created new release with ID "${releaseId}"`, {
    release: {
      releaseId,
      title: params.title,
      description: params.description,
      releaseType: params.releaseType,
      intendedPublishAt,
    },
  })
}

export const createReleaseTool = withErrorHandling(tool, 'Error creating release')
