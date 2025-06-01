import {z} from 'zod'
import {ensureArray, pluralize} from '../../utils/formatters.js'
import {validateGroqQuery} from '../../utils/groq.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {tokenLimit, limitByTokens} from '../../utils/tokens.js'

export const QueryDocumentsToolParams = BaseToolSchema.extend({
  single: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to return a single document or a list'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe('Maximum number of documents to return (subject to token limits)'),
  params: z.record(z.any()).optional().describe('Optional parameters for the GROQ query'),
  query: z
    .string()
    .describe('Complete GROQ query (e.g. "*[_type == \\"post\\"][0...10]{title, _id}")'),
  perspective: z
    .union([z.enum(['raw', 'drafts', 'published']), z.string()])
    .optional()
    .default('raw')
    .describe(
      'Optional perspective to query from: "raw", "drafts", "published", or a release ID. Models should examine available releases and perspectives in the dataset before selecting one to ensure they are querying from the most appropriate view of the content.',
    ),
})

type Params = z.infer<typeof QueryDocumentsToolParams>

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
  const allDocuments = ensureArray(result)

  const {selectedItems: selectedDocuments, formattedItems: formattedDocuments, tokensUsed: totalTokens} = limitByTokens(
    allDocuments,
    (doc) => JSON.stringify(doc, null, 2),
    tokenLimit,
    params.limit
  )

  return createSuccessResponse(
    `Query executed successfully. Found ${allDocuments.length} total ${pluralize(allDocuments, 'document')}, returning ${selectedDocuments.length} (${totalTokens} tokens)`,
    {
      documents: formattedDocuments,
      count: selectedDocuments.length,
      totalAvailable: allDocuments.length,
      tokensUsed: totalTokens,
      rawResults: selectedDocuments,
    },
  )
}

export const queryDocumentsTool = withErrorHandling(tool, 'Error executing GROQ query')
