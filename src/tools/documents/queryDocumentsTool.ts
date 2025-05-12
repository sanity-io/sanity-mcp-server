import {z} from 'zod'
import {ensureArray} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

const DEFAULT_PERSPECTIVE = 'raw'
const DEFAULT_PROJECTION = '...'
const DEFAULT_PAGE_SIZE = 5

export const QueryDocumentsToolParams = z
  .object({
    filter: z.string().describe('The GROQ filter condition to apply (e.g., "_type == \\"post\\"'),
    projection: z
      .string()
      .optional()
      .default(DEFAULT_PROJECTION)
      .describe('The fields to include in the result'),
    params: z.record(z.any()).optional().describe('Optional parameters for the GROQ query'),
    page: z
      .number()
      .optional()
      .default(1)
      .describe('Page number for paginated results (starts at 1)'),
    pageSize: z
      .number()
      .optional()
      .default(DEFAULT_PAGE_SIZE)
      .describe('Number of results per page'),
    perspective: z
      .union([z.enum(['raw', 'drafts', 'published']), z.string()])
      .optional()
      .default(DEFAULT_PERSPECTIVE)
      .describe(
        'Optional perspective to query from: "raw", "drafts", "published", or a release ID',
      ),
  })
  .merge(BaseToolSchema)

type Params = z.infer<typeof QueryDocumentsToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const perspectiveClient = client.withConfig({
    perspective: params.perspective ? [params.perspective] : DEFAULT_PERSPECTIVE,
  })

  // Filter
  let query = `*[${params.filter}]`

  // Pagination
  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize
  query += `[${start}...${end}]`

  // Projection
  query += `{${params.projection}}`

  const result = await perspectiveClient.fetch(query, params.params)
  const documents = ensureArray(result).map((doc) => JSON.stringify(doc, null, 2))

  const totalCount = await perspectiveClient.fetch(`count(*[${params.filter}])`, params.params)
  const totalPages = Math.ceil(totalCount / params.pageSize)

  return createSuccessResponse(
    `Found ${documents.length} documents (page ${params.page} of ${totalPages})`,
    {
      documents,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalPages,
        totalCount,
      },
    },
  )
}

export const queryDocumentsTool = withErrorHandling(tool, 'Error executing GROQ query')
