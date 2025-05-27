import {z} from 'zod'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {type DocumentId, getDraftId, getPublishedId, getVersionId} from '@sanity/id-utils'
import {BaseToolSchema, createToolClient, WorkspaceNameSchema} from '../../utils/tools.js'
import {stringToAgentPath} from '../../utils/path.js'
import {resolveSchemaId} from '../../utils/resolvers.js'

const SetOperation = z.object({
  op: z.literal('set'),
  path: z.string().describe('The path to set, e.g. "title" or "author.name"'),
  value: z
    .any()
    .describe(
      'The value to set at the specified path. This is an overwriting operation that replaces the full field value.',
    ),
})

const UnsetOperation = z.object({
  op: z.literal('unset'),
  path: z.string().describe('The path to unset, e.g. "description" or "metadata.keywords"'),
})

const AppendOperation = z.object({
  op: z.literal('append'),
  path: z
    .string()
    .describe(
      'The path to append to, e.g. "categories" or "items". Can target arrays, strings, text, or numbers.',
    ),
  value: z
    .array(z.any())
    .describe(
      'The items to append. Behavior varies by field type: arrays get new items appended, strings get space-separated concatenation, text fields get newline-separated concatenation, numbers get added together.',
    ),
})

const MixedOperation = z.object({
  op: z.literal('mixed'),
  value: z
    .record(z.any())
    .describe(
      'Object with mixed operations (default behavior). Sets non-array fields and appends to array fields. Use this when you want to update multiple fields with different behaviors in one operation.',
    ),
})

const PatchOperation = z.discriminatedUnion('op', [
  SetOperation,
  UnsetOperation,
  AppendOperation,
  MixedOperation,
])

export const PatchDocumentToolParams = BaseToolSchema.extend({
  documentId: z.string().describe('The ID of the document to patch'),
  workspaceName: WorkspaceNameSchema,
  operations: z
    .array(PatchOperation)
    .describe(
      'Array of patch operations to apply. Operations are schema-validated and merge with existing data rather than replacing it entirely.',
    ),
  releaseId: z
    .string()
    .optional()
    .describe(
      'Optional release ID for patching versioned documents. If provided, the document in the specified release will be patched.',
    ),
})

type Params = z.infer<typeof PatchDocumentToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = getPublishedId(params.documentId as DocumentId)
  const documentId = params.releaseId ? getVersionId(publishedId, params.releaseId) : publishedId

  const document = await client.getDocument(documentId)
  if (!document) {
    throw new Error(`Document with ID '${documentId}' not found`)
  }

  const targets = params.operations.map((operation) => {
    switch (operation.op) {
      case 'set':
        return {
          path: stringToAgentPath(operation.path),
          operation: 'set' as const,
          value: operation.value,
        }
      case 'unset':
        return {
          path: stringToAgentPath(operation.path),
          operation: 'unset' as const,
        }
      case 'append':
        return {
          path: stringToAgentPath(operation.path),
          operation: 'append' as const,
          value: operation.value,
        }
      case 'mixed':
        return {
          path: [],
          operation: 'mixed' as const,
          value: operation.value,
        }
    }
  })

  const result = await client.agent.action.patch({
    documentId,
    schemaId: resolveSchemaId(params.workspaceName),
    target: targets.length === 1 ? targets[0] : targets,
  })

  return createSuccessResponse('Document patched successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(result.document),
  })
}

export const patchDocumentTool = withErrorHandling(tool, 'Error patching document')
