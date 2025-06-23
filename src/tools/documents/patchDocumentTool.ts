import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient, WorkspaceNameSchema} from '../../utils/tools.js'
import {stringToAgentPath} from '../../utils/path.js'
import {resolveDocumentId, resolveSchemaId} from '../../utils/resolvers.js'
import {getMutationCheckpoint} from '../../utils/checkpoint.js'

const SetOperation = z.object({
  op: z.literal('set'),
  path: z
    .string()
    .describe(
      'The path to set. Supports: simple fields ("title"), nested objects ("author.name"), array items by key ("items[_key==\\"item-1\\"]"), and nested properties in arrays ("items[_key==\\"item-1\\"].title")',
    ),
  value: z
    .any()
    .describe(
      'The value to set at the specified path. This is an overwriting operation that replaces the full field value.',
    ),
})

const UnsetOperation = z.object({
  op: z.literal('unset'),
  path: z
    .string()
    .describe(
      'The path to unset. Supports: simple fields ("description"), nested objects ("metadata.keywords"), array items by key ("tags[_key==\\"tag-1\\"]"), and nested properties in arrays ("gallery[_key==\\"img-1\\"].alt")',
    ),
})

const AppendOperation = z.object({
  op: z.literal('append'),
  path: z
    .string()
    .describe(
      'The path to append to. Supports: simple fields ("categories"), nested arrays ("metadata.tags"), and arrays within keyed items ("sections[_key==\\"sec-1\\"].items"). Can target arrays, strings, text, or numbers.',
    ),
  value: z
    .array(z.unknown())
    .describe(
      'The items to append. Behavior varies by field type: arrays get new items appended, strings get space-separated concatenation, text fields get newline-separated concatenation, numbers get added together.',
    ),
})

export const PatchDocumentToolParams = BaseToolSchema.extend({
  documentId: z.string().describe('The ID of the document to patch'),
  workspaceName: WorkspaceNameSchema,
  operation: z
    .discriminatedUnion('op', [
      SetOperation,
      UnsetOperation,
      AppendOperation,
      // MixedOperation,
    ])
    .describe(
      'Patch operation to apply. Operation is schema-validated and merges with existing data rather than replacing it entirely.',
    ),
  releaseId: z
    .string()
    .optional()
    .describe(
      'Optional release ID for patching versioned documents. If provided, the document in the specified release will be patched.',
    ),
})

type Params = z.infer<typeof PatchDocumentToolParams>

async function _tool(params: Params) {
  const client = createToolClient(params)
  const documentId = resolveDocumentId(params.documentId, params.releaseId)
  const checkpoint = await getMutationCheckpoint(documentId, client)

  const target = (() => {
    switch (params.operation.op) {
      case 'set':
        return {
          path: stringToAgentPath(params.operation.path),
          operation: 'set' as const,
          value: params.operation.value,
        }
      case 'unset':
        return {
          path: stringToAgentPath(params.operation.path),
          operation: 'unset' as const,
        }
      case 'append':
        return {
          path: stringToAgentPath(params.operation.path),
          operation: 'append' as const,
          value: params.operation.value,
        }
    }
  })()

  const result = await client.agent.action.patch({
    documentId,
    conditionalPaths: {
      defaultHidden: false,
      defaultReadOnly: false,
    },
    schemaId: resolveSchemaId(params.workspaceName),
    target,
  })

  return createSuccessResponse(
    'Document patched successfully',
    {
      success: true,
      document: result.document,
    },
    checkpoint,
  )
}

export const patchDocumentTool = withErrorHandling(_tool, 'Error patching document')
