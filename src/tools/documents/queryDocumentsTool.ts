import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {ensureArray} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

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

async function tool(params: Params) {
  const perspectiveClient = sanityClient.withConfig({
    perspective: params.perspective ? [params.perspective] : DEUFALT_PERSPECTIVE,
  })
  const result = await perspectiveClient.fetch(params.query, params.params || {})
  const documents = ensureArray(result).map((doc) => JSON.stringify(doc, null, 2))

  return createSuccessResponse(`Found a total of ${documents.length} documents`, {documents})
}

export const queryDocumentsTool = withErrorHandling(tool, 'Error executing GROQ query')
