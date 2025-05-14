import {z} from 'zod'
import {parse} from 'groq-js'
import {ensureArray} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const QueryDocumentsToolParams = BaseToolSchema.extend({
  single: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to return a single document or an array'),
  limit: z.number().min(1).max(10).default(5).describe('Maximum number of documents to return'),
  params: z.record(z.any()).optional().describe('Optional parameters for the GROQ query'),
  query: z.string().describe('Complete GROQ query (e.g. "*[_type == \\"post\\"]{title, _id}")'),
  perspective: z
    .union([z.enum(['raw', 'drafts', 'published']), z.string()])
    .optional()
    .default('raw')
    .describe(
      'Optional perspective to query from: "raw", "drafts", "published", or a release ID. Models should examine available releases and perspectives in the dataset before selecting one to ensure they are querying from the most appropriate view of the content.',
    ),
})

type Params = z.infer<typeof QueryDocumentsToolParams>

async function validateGroqQuery(
  query: string,
): Promise<{isValid: boolean; error?: string; tree?: ReturnType<typeof parse>}> {
  try {
    const tree = parse(query)
    return {isValid: true, tree}
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function tool(params: Params) {
  const validation = await validateGroqQuery(params.query)
  if (!validation.isValid) {
    throw new Error(`Invalid GROQ query: ${validation.error}`)
  }

  const client = createToolClient(params)
  const perspectiveClient = client.withConfig({
    perspective: params.perspective ? [params.perspective] : ['raw'],
  })

  const result = await perspectiveClient.fetch(params.query, params.params)
  const documents = ensureArray(result)
  const formattedDocuments = documents.map((doc) => JSON.stringify(doc, null, 2))

  return createSuccessResponse(
    `Query executed successfully. Found ${documents.length} documents.`,
    {
      documents: formattedDocuments,
      count: documents.length,
      rawResults: documents,
    },
  )
}

export const queryDocumentsTool = withErrorHandling(tool, 'Error executing GROQ query')
