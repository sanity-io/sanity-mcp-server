import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {parseDateString} from '../../utils/dates.js'
import {generateSanityId} from '../../utils/id.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {ReleaseSchemas} from './common.js'

export const CreateReleaseToolParams = z.object({
  title: ReleaseSchemas.title,
  description: ReleaseSchemas.description.optional(),
  releaseType: ReleaseSchemas.releaseType.optional(),
  intendedPublishAt: ReleaseSchemas.publishDate.optional(),
})

type Params = z.infer<typeof CreateReleaseToolParams>

async function tool(params: Params) {
  const releaseId = generateSanityId(8, 'r')
  const intendedPublishAt = parseDateString(params.intendedPublishAt)

  const response = await sanityClient.request({
    uri: `/data/actions/${sanityClient.config().dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.release.create',
          releaseId,
          metadata: {
            title: params.title,
            description: params.description,
            releaseType: params.releaseType,
            intendedPublishAt,
          },
        },
      ],
    },
  })

  if (response.error) {
    return createErrorResponse(response.error.description)
  }

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
