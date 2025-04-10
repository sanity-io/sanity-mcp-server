import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse, truncateDocumentForLLMOutput} from '../../../utils/formatters.js'
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

export async function createVersionTool(params: Params) {
  try {
    const publishedId = getPublishedId(params.documentId as DocumentId)
    const versionId = `versions.${params.releaseId}.${publishedId}`

    const originalDocument = await sanityClient.getDocument(publishedId)

    if (!originalDocument) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error: Document with ID '${params.documentId}' not found`,
          },
        ],
      }
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

    const message = formatResponse('Version created and modified with AI successfully', {
      success: true,
      document: truncateDocumentForLLMOutput(newDocument),
    })

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
          text: `Error creating document version: ${errorMessage}`,
        },
      ],
    }
  }
}
