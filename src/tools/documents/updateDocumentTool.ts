import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import type {GenerateInstruction} from '@sanity/client'
import {stringToAgentPath} from '../../utils/path.js'
import {resolveDocumentId, resolveSchemaId} from '../../utils/resolvers.js'

export const UpdateDocumentToolParams = BaseToolSchema.extend({
  documentId: z.string().describe('The ID of the document to update'),
  instruction: z.string().describe('Instruction for AI to update the document content'),
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

async function tool(params: Params) {
  const client = createToolClient(params)
  const documentId = resolveDocumentId(params.documentId, params.releaseId)

  const instructOptions: GenerateInstruction = {
    documentId,
    instruction: params.instruction,
    schemaId: resolveSchemaId(params.workspaceName),
    target: params.paths
      ? params.paths.map((path) => ({path: stringToAgentPath(path)}))
      : undefined,
  } as const

  if (params.async === true) {
    await client.agent.action.generate({
      ...instructOptions,
      async: true,
    })

    return createSuccessResponse('Document update initiated in background', {
      success: true,
      document: {_id: params.documentId},
    })
  }

  const updatedDocument = await client.agent.action.generate(instructOptions)

  return createSuccessResponse('Document updated successfully', {
    success: true,
    document: updatedDocument,
  })
}

export const updateDocumentTool = withErrorHandling(tool, 'Error updating document')
