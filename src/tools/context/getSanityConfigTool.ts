import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

export const GetSanityConfigToolParams = z.object({})

type Params = z.infer<typeof GetSanityConfigToolParams>

async function tool(_params?: Params) {
  const config = sanityClient.config()

  const configData = {
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: config.useCdn,
    perspective: config.perspective,
  }

  return createSuccessResponse('Current Sanity Configuration', configData)
}

export const getSanityConfigTool = withErrorHandling(tool, 'Error fetching Sanity configuration')
