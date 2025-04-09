import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const GetSanityConfigToolParams = z.object({})

type Params = z.infer<typeof GetSanityConfigToolParams>

export async function getSanityConfigTool(_params: Params) {
  try {
    const config = sanityClient.config()

    const configData = {
      projectId: config.projectId,
      dataset: config.dataset,
      apiVersion: config.apiVersion,
      useCdn: config.useCdn,
      perspective: config.perspective,
    }

    const message = formatResponse('Current Sanity Configuration', configData)

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
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
          text: `Error fetching Sanity configuration: ${errorMessage}`,
        },
      ],
    }
  }
}
