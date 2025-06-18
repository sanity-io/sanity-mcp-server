import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient, WorkspaceNameSchema} from '../../utils/tools.js'
import {
  resolveAiActionInstruction,
  resolveDocumentId,
  resolveSchemaId,
} from '../../utils/resolvers.js'
import type {Checkpoint} from '../../types/checkpoint.js'
import {getCreationCheckpoint} from '../../utils/checkpoint.js'
import {processBulkOperation, createBulkOperationMessage} from '../../utils/bulk.js'

export const CreateDocumentToolParams = BaseToolSchema.extend({
  type: z.string().describe('The document type'),
  instruction: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe(
      'Array of instructions for AI to create document content (min 1, max 10). One document will be created per instruction',
    ),
  workspaceName: WorkspaceNameSchema,
  releaseId: z
    .string()
    .optional()
    .describe(
      'Optional release ID for creating versioned documents. If provided, the document will be created under the specified release version instead of as a draft',
    ),
})

type Params = z.infer<typeof CreateDocumentToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const runAsync = params.instruction?.length > 1
  const checkpoints: Checkpoint[] = []

  const process = async (instruction: string) => {
    const documentId = resolveDocumentId(randomUUID(), params.releaseId)
    checkpoints.push(getCreationCheckpoint(documentId, client))

    const generateOptions = {
      targetDocument: {
        operation: 'create',
        _id: documentId,
        _type: params.type,
      },
      instruction: resolveAiActionInstruction(instruction),
      schemaId: resolveSchemaId(params.workspaceName),
    } as const

    const createdDocument = await client.agent.action.generate({
      ...generateOptions,
      async: runAsync,
    })

    return {
      instruction,
      document: createdDocument,
      success: true,
      async: runAsync,
    }
  }

  const {results, summary} = await processBulkOperation(params.instruction, process)

  return createSuccessResponse(
    createBulkOperationMessage('documents', summary, runAsync),
    {
      results,
      summary,
    },
    checkpoints,
  )
}

export const createDocumentTool = withErrorHandling(tool, 'Error creating document')
