import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient, WorkspaceNameSchema} from '../../utils/tools.js'
import {resolveDocumentId, resolveSchemaId} from '../../utils/resolvers.js'

export const CreateDocumentToolParams = BaseToolSchema.extend({
  _type: z.string().describe('The document type'),
  instruction: z.string().describe('Optional instruction for AI to create the document content'),
  workspaceName: WorkspaceNameSchema,
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
  const client = createToolClient(params)

  const documentId = resolveDocumentId(randomUUID(), params.releaseId)
  const generateOptions = {
    targetDocument: {
      operation: 'create',
      _id: documentId,
      _type: params._type,
    },
    instruction: params.instruction,
    schemaId: resolveSchemaId(params.workspaceName),
  } as const

  if (params.async === true) {
    await client.agent.action.generate({
      ...generateOptions,
      async: true,
    })

    return createSuccessResponse('Document creation initiated in background', {
      success: true,
      document: {_id: documentId, _type: params._type},
    })
  }

  const createdDocument = await client.agent.action.generate(generateOptions)

  return createSuccessResponse('Document created successfully', {
    success: true,
    document: createdDocument,
  })
}

export const createDocumentTool = withErrorHandling(tool, 'Error creating document')
