import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {stringToAgentPath} from '../../utils/path.js'
import {
  resolveAiActionInstruction,
  resolveDocumentId,
  resolveSchemaId,
} from '../../utils/resolvers.js'
import {getCreationCheckpoint, getMutationCheckpoint} from '../../utils/checkpoint.js'
import type {DocumentId} from '@sanity/id-utils'

export const TransformDocumentToolParams = BaseToolSchema.extend({
  documentId: z.string().describe('The ID of the source document to transform'),
  instruction: z.string().describe('Instructions for transforming the document content'),
  workspaceName: WorkspaceNameSchema,
  operation: z
    .enum(['create', 'edit'])
    .default('edit')
    .optional()
    .describe(
      'Operation type: "edit" modifies existing document, "create" creates new document. Use "edit" unless specified otherwise. In a release context, you should most likely use "edit" rather than "create".',
    ),
  paths: z
    .array(z.string())
    .optional()
    .describe(
      'Optional target field paths for the transformation. If not set, transforms the whole document. Supports: simple fields ("title"), nested objects ("author.name"), array items by key ("items[_key==\"item-1\"]"), and nested properties in arrays ("items[_key==\"item-1\"].title"). ie: ["field", "array[_key==\"key\"]"] where "key" is a json match',
    ),
  async: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Set to true for background processing when transforming multiple documents for better performance.',
    ),
  instructionParams: z
    .record(z.any())
    .optional()
    .describe(
      'Dynamic parameters that can be referenced in the instruction using $paramName syntax',
    ),
})

type Params = z.infer<typeof TransformDocumentToolParams>

async function _tool(params: Params) {
  const client = createToolClient(params)
  const sourceDocumentId = resolveDocumentId(params.documentId)

  const targetDocumentId =
    params.operation === 'create' ? resolveDocumentId(randomUUID()) : sourceDocumentId

  const checkpoint =
    params.operation === 'create'
      ? getCreationCheckpoint(targetDocumentId as DocumentId, client)
      : await getMutationCheckpoint(targetDocumentId as DocumentId, client)

  const document = await client.agent.action.transform({
    documentId: params.documentId,
    instruction: resolveAiActionInstruction(params.instruction),
    schemaId: resolveSchemaId(params.workspaceName),
    targetDocument:
      params.operation === 'create'
        ? {operation: 'create', _id: targetDocumentId}
        : {operation: 'edit', _id: sourceDocumentId},
    target: params.paths
      ? params.paths.map((path) => ({path: stringToAgentPath(path)}))
      : undefined,
    instructionParams: params.instructionParams,
    async: params.async,
  })

  const message = params.async
    ? 'Document transformation initiated in background'
    : 'Document transformed successfully'

  return createSuccessResponse(message, {success: true, document}, checkpoint)
}

export const transformDocumentTool = withErrorHandling(_tool, 'Error transforming document')
