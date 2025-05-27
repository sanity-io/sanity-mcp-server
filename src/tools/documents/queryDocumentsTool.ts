import {z} from 'zod'
import {isWithinTokenLimit, countTokens} from 'gpt-tokenizer'
import {ensureArray, pluralize} from '../../utils/formatters.js'
import {validateGroqQuery} from '../../utils/groq.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {tokenLimit} from '../../utils/tokens.js'

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

  // Get token limit from environment or use default
  const selectedDocuments: unknown[] = [] // Raw document objects for rawResults field
  const formattedDocuments: string[] = [] // JSON-stringified documents for token counting and main response

  // Process documents until we hit token limit or requested limit
  for (let i = 0; i < Math.min(allDocuments.length, params.limit); i++) {
    const doc: unknown = allDocuments[i]
    const formattedDoc = JSON.stringify(doc, null, 2)

    // Try adding this document to the current batch
    const potentialFormattedDocs = [...formattedDocuments, formattedDoc]
    const combinedText = potentialFormattedDocs.join('\n')

    // Check if adding this document would exceed the token limit
    const withinLimit = isWithinTokenLimit(combinedText, tokenLimit)
    if (withinLimit === false && selectedDocuments.length > 0) {
      break
    }

    selectedDocuments.push(doc)
    formattedDocuments.push(formattedDoc)
  }

  // Get final token count
  const finalText = formattedDocuments.join('\n')
  const totalTokens = countTokens(finalText)

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
