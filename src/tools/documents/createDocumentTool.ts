import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import {sanityClient} from '../../config/sanity.js'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {type DocumentId, getDraftId, getVersionId} from '@sanity/id-utils'

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

async function tool(params: Params) {
  const publishedId = randomUUID() as DocumentId
  const documentId = params.releaseId
    ? getVersionId(publishedId, params.releaseId)
    : getDraftId(publishedId)

  const generateOptions = {
    targetDocument: {
      operation: 'create',
      _type: params._type,
    },
    instruction: params.instruction,
    schemaId: params.schemaId,
  } as const

  if (params.async === true) {
    await sanityClient.agent.action.generate({
      ...generateOptions,
      async: true,
    })

    return createSuccessResponse('Document creation initiated in background', {
      success: true,
      document: {_id: documentId, _type: params._type},
    })
  }

  const createdDocument = await sanityClient.agent.action.generate(generateOptions)

  return createSuccessResponse('Document created successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(createdDocument),
  })
}

export const createDocumentTool = withErrorHandling(tool, 'Error creating document')
