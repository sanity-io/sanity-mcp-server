import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {type DocumentId, getPublishedId} from '@sanity/id-utils'

export const CreateVersionToolParams = z.object({
  documentId: z.string().describe('ID of the document to create a version for'),
  releaseId: z.string().describe('ID of the release to associate this version with'),
  instruction: z
    .string()
    .optional()
    .describe('Optional instruction for AI to modify the document while creating the version'),
  schemaId: z
    .string()
    .optional()
    .describe(
      'Schema ID defining the document structure - required when providing an instruction for AI modification',
    ),
})

type Params = z.infer<typeof CreateVersionToolParams>

async function tool(params: Params) {
  const publishedId = getPublishedId(params.documentId as DocumentId)
  const versionId = `versions.${params.releaseId}.${publishedId}`

  const originalDocument = await sanityClient.getDocument(publishedId)

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
          publishedId: publishedId,
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
