import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse, truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {type DocumentId, getPublishedId} from '@sanity/id-utils'

export const UpdateDocumentToolParams = z.object({
  documentId: z.string().describe('The ID of the document to update'),
  instruction: z.string().describe('Instruction for AI to update the document content'),
  schemaId: z.string().describe('Schema ID to follow'),
  path: z
    .string()
    .optional()
    .describe('Optional field path within the document to target with the instruction'),
  releaseId: z
    .string()
    .optional()
    .describe(
      'Optional release ID for creating versioned documents. If provided, the document will be created under the specified release version instead of as a draft',
    ),
  async: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Set to true for background processing when updating multiple documents for better performance.',
    ),
})

type Params = z.infer<typeof UpdateDocumentToolParams>

export async function updateDocumentTool(params: Params) {
  try {
    const publishedId = getPublishedId(params.documentId as DocumentId)
    const documentId = params.releaseId
      ? `versions.${params.releaseId}.${publishedId}`
      : publishedId

    const instructOptions = {
      documentId,
      schemaId: params.schemaId,
      instruction: params.instruction,
      path: params.path,
    } as const

    if (params.async === true) {
      await sanityClient.agent.action.generate({
        ...instructOptions,
        async: true,
      })

      const message = formatResponse('Document update initiated in background', {
        success: true,
        document: {_id: params.documentId},
      })

      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
      }
    }

    const updatedDocument = await sanityClient.agent.action.generate(instructOptions)

    const message = formatResponse('Document updated successfully', {
      success: true,
      document: truncateDocumentForLLMOutput(updatedDocument),
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
          text: `Error updating document: ${errorMessage}`,
        },
      ],
    }
  }
}
