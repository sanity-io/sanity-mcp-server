import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {MaybeResourceParam, ToolCallExtra, WorkspaceNameSchema, createToolClient} from '../../utils/tools.js'
import type {GenerateInstruction} from '@sanity/client'
import {stringToAgentPath} from '../../utils/path.js'
import {resolveDocumentId, resolveSchemaId} from '../../utils/resolvers.js'
import {getMutationCheckpoint} from '../../utils/checkpoint.js'
import type {Checkpoint} from '../../types/checkpoint.js'
import {processBulkOperation, createBulkOperationMessage} from '../../utils/bulk.js'

const UpdateOperationSchema = z.object({
  documentId: z.string().describe('The ID of the document to update'),
  instruction: z.string().describe('Instruction for AI to update the document content'),
})

export const UpdateDocumentToolParams = z.object({
  operations: z
    .array(UpdateOperationSchema)
    .min(1)
    .max(10)
    .describe('Array of update operations, each with documentId and instruction (min 1, max 10)'),
  workspaceName: WorkspaceNameSchema,
  paths: z
    .array(z.string())
    .optional()
    .describe(
      'Target field paths for the instruction. Specifies fields to update. Should always be set if you want to update specific fields. If not set, targets the whole document. Supports: simple fields ("title"), nested objects ("author.name"), array items by key ("items[_key==\"item-1\"]"), and nested properties in arrays ("items[_key==\"item-1\"].title"). ie: ["field", "array[_key==\"key\"]"] where "key" is a json match',
    ),
  releaseId: z
    .string()
    .optional()
    .describe(
      'Optional release ID for updating versioned documents. If provided, the document will be updated under the specified release version instead of as a draft',
    ),
})

type Params = z.infer<typeof UpdateDocumentToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const runAsync = params.operations?.length > 1
  const checkpoints: Checkpoint[] = []

  const process = async (operation: {documentId: string; instruction: string}) => {
    const documentId = resolveDocumentId(operation.documentId, params.releaseId)
    checkpoints.push(await getMutationCheckpoint(documentId, client))

    const instructOptions: GenerateInstruction = {
      documentId,
      instruction: operation.instruction,
      schemaId: resolveSchemaId(params.workspaceName),
      target: params.paths
        ? params.paths.map((path) => ({path: stringToAgentPath(path)}))
        : undefined,
    } as const

    const updatedDocument = await client.agent.action.generate({
      ...instructOptions,
      async: runAsync,
    })

    return {
      documentId: operation.documentId,
      instruction: operation.instruction,
      document: updatedDocument,
      success: true,
      async: runAsync,
    }
  }

  const {results, summary} = await processBulkOperation(params.operations, process)

  return createSuccessResponse(
    createBulkOperationMessage('documents', summary, runAsync),
    {
      results,
      summary,
    },
    checkpoints,
  )
}

export const updateDocumentTool = withErrorHandling(_tool, 'Error updating document')
