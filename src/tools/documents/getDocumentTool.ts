import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {isDraftId, getPublishedId, getDraftId, type DocumentId} from '@sanity/id-utils'

export const GetDocumentToolParams = z.object({
  documentId: z.string().describe('The ID of the document to retrieve'),
  perspective: z
    .union([z.enum(['raw', 'drafts', 'published']), z.string()])
    .optional()
    .default('raw')
    .describe('Perspective to query from: "raw", "drafts", "published", or a release ID'),
})

type Params = z.infer<typeof GetDocumentToolParams>

async function tool(params: Params) {
  const perspectiveClient = sanityClient.withConfig({
    perspective: params.perspective ? [params.perspective] : 'raw',
  })

  const documentId = params.documentId as DocumentId
  const alternateId = isDraftId(documentId) ? getPublishedId(documentId) : getDraftId(documentId)

  // Fetch both the document and its alternative version in parallel
  const [primaryDoc, alternateDoc] = await Promise.all([
    perspectiveClient.getDocument(documentId).catch(() => null),
    perspectiveClient.getDocument(alternateId).catch(() => null),
  ])

  const document = primaryDoc || alternateDoc

  if (!document) {
    return createSuccessResponse('Document not found', {
      success: false,
      message: `No document found with ID: ${params.documentId} or its published/draft equivalent in perspective: ${params.perspective}`,
    })
  }

  return createSuccessResponse('Document retrieved successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(document),
  })
}

export const getDocumentTool = withErrorHandling(tool, 'Error retrieving document')
