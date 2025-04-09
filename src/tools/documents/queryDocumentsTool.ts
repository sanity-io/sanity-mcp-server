import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse, truncateDocumentForLLMOutput, ensureArray} from '../../utils/formatters.js'

const DEUFALT_PERSPECTIVE = 'raw'

export const QueryDocumentsToolParams = z.object({
  query: z.string().describe('The GROQ query to execute'),
  params: z.record(z.any()).optional().describe('Optional parameters for the GROQ query'),
  limit: z.number().optional().describe('Optional limit to truncate large result sets'),
  perspective: z
    .string()
    .optional()
    .default(DEUFALT_PERSPECTIVE)
    .describe('Optional perspective to query from, such as a release ID or "published"'),
})

type Params = z.infer<typeof QueryDocumentsToolParams>

export async function queryDocumentsTool(params: Params) {
  try {
    const perspectiveClient = sanityClient.withConfig({
      perspective: params.perspective ? [params.perspective] : DEUFALT_PERSPECTIVE,
    })
    const result = await perspectiveClient.fetch(params.query, params.params || {})

    const documents = ensureArray(result)
      .map(truncateDocumentForLLMOutput)
      .map((doc) => JSON.stringify(doc))

    const message = formatResponse(`Found a total of ${documents.length} documents`, {documents})

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
          text: `Error executing GROQ query: ${errorMessage}`,
        },
      ],
    }
  }
}
