import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient, WorkspaceNameSchema} from '../../utils/tools.js'
import {
  resolveAiActionInstruction,
  resolveDocumentId,
  resolveSchemaId,
} from '../../utils/resolvers.js'

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

  const process = async (instruction: string) => {
    const documentId = resolveDocumentId(randomUUID(), params.releaseId)
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

  const results = await Promise.all(
    params.instruction.map(async (instruction) => {
      try {
        return await process(instruction)
      } catch (error) {
        return {
          instruction,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }),
  )

  const successCount = results.filter((r) => r.success).length
  const failureCount = results.length - successCount

  const message = runAsync
    ? `Initiated creation for ${params.instruction.length} documents in background: ${successCount} successful, ${failureCount} failed`
    : `Created ${params.instruction.length} documents: ${successCount} successful, ${failureCount} failed`

  return createSuccessResponse(message, {
    results,
    summary: {
      total: params.instruction.length,
      successful: successCount,
      failed: failureCount,
    },
  })
}

export const createDocumentTool = withErrorHandling(tool, 'Error creating document')
