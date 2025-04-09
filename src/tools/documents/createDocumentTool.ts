import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse, truncateDocumentForLLMOutput} from '../../utils/formatters.js'

/* Create and update are defined as separate tools */
export const CreateDocumentToolParams = z.object({
  _type: z.string().describe('The document type'),
  instruction: z.string().describe('Optional instruction for AI to create the document content'),
  schemaId: z.string().describe('Schema ID to follow'),
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
      'Set to true for background processing when creating multiple documents for better performance.',
    ),
})

type Params = z.infer<typeof CreateDocumentToolParams>

export async function createDocumentTool(params: Params) {
  try {
    const {_type, instruction, schemaId, releaseId, async} = params

    const publishedId = randomUUID()
    const documentId = releaseId ? `versions.${releaseId}.${publishedId}` : `drafts.${publishedId}`

    const instructOptions = {
      createDocument: {
        _id: documentId,
        _type,
      },
      schemaId,
      instruction,
    } as const

    if (async === true) {
      await sanityClient.agent.action.generate({
        ...instructOptions,
        async: true,
      })

      const message = formatResponse('Document creation initiated in background', {
        success: true,
        document: {_id: documentId, _type},
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

    const createdDocument = await sanityClient.agent.action.generate(instructOptions)

    const message = formatResponse('Document created successfully', {
      success: true,
      document: truncateDocumentForLLMOutput(createdDocument),
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
          text: `Error creating document: ${errorMessage}`,
        },
      ],
    }
  }
}
