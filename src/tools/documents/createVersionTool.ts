import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {
  type DocumentId,
  getDraftId,
  getPublishedId,
  getVersionId,
  isDraftId,
} from '@sanity/id-utils'
import {schemaIdSchema} from '../schema/common.js'

export const CreateVersionToolParams = z.object({
  documentId: z.string().describe('ID of the document to create a version for'),
  releaseId: z.string().describe('ID of the release to associate this version with'),
  instruction: z
    .string()
    .optional()
    .describe('Optional instruction for AI to modify the document while creating the version'),
  schemaId: schemaIdSchema,
})

type Params = z.infer<typeof CreateVersionToolParams>

async function tool(params: Params) {
  const documentId = params.documentId as DocumentId

  const publishedId = getPublishedId(documentId)
  const versionId = getVersionId(publishedId, params.releaseId)

  const alternateId = isDraftId(documentId) ? publishedId : getDraftId(documentId)

  // Fetch both the document and its alternative version in parallel
  const [primaryDoc, alternateDoc] = await Promise.all([
    sanityClient.getDocument(documentId).catch(() => null),
    sanityClient.getDocument(alternateId).catch(() => null),
  ])

  const originalDocument = primaryDoc || alternateDoc

  if (!originalDocument) {
    return createErrorResponse(`Document with ID '${params.documentId}' not found`)
  }

  let newDocument = await sanityClient.request({
    uri: `/data/actions/${sanityClient.config().dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.document.version.create',
          publishedId,
          document: {
            ...originalDocument,
            _id: versionId,
          },
        },
      ],
    },
  })

  if (params.instruction && params.schemaId) {
    newDocument = await sanityClient.agent.action.generate({
      documentId: versionId,
      schemaId: params.schemaId,
      instruction: params.instruction,
    })
  }

  return createSuccessResponse('Version created and modified with AI successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(newDocument),
  })
}

export const createVersionTool = withErrorHandling(tool, 'Error creating document version')
