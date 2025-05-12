import {z} from 'zod'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {type DocumentId, getDraftId, getPublishedId, getVersionId} from '@sanity/id-utils'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

const SetOperation = z.object({
  op: z.literal('set'),
  path: z.string().describe('The path to set, e.g. "title" or "author.name"'),
  value: z.any().describe('The value to set at the specified path'),
})

const UnsetOperation = z.object({
  op: z.literal('unset'),
  path: z.string().describe('The path to unset, e.g. "description" or "metadata.keywords"'),
})

const InsertValueSchema = z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())])

const InsertOperation = z.object({
  op: z.literal('insert'),
  position: z.enum(['before', 'after', 'replace']),
  path: z
    .string()
    .describe('The path to the array or element, e.g. "categories" or "categories[0]"'),
  items: z
    .array(InsertValueSchema)
    .describe(
      'The items to insert. Array items must be either all primitives or all objects, they can never be mixed in one array.',
    ),
})

const IncOperation = z.object({
  op: z.literal('inc'),
  path: z.string().describe('The path to increment, e.g. "views" or "stats.visits"'),
  amount: z.number().describe('The amount to increment by'),
})

const DecOperation = z.object({
  op: z.literal('dec'),
  path: z.string().describe('The path to decrement, e.g. "stock" or "inventory.count"'),
  amount: z.number().describe('The amount to decrement by'),
})

const SetIfMissingOperation = z.object({
  op: z.literal('setIfMissing'),
  path: z.string().describe('The path to set if missing, e.g. "metadata" or "settings.defaults"'),
  value: z.any().describe('The value to set if the path is missing'),
})

const PatchOperation = z.discriminatedUnion('op', [
  SetOperation,
  UnsetOperation,
  InsertOperation,
  IncOperation,
  DecOperation,
  SetIfMissingOperation,
])

export const PatchDocumentToolParams = z
  .object({
    documentId: z.string().describe('The ID of the document to patch'),
    operations: z.array(PatchOperation).describe('Array of patch operations to apply'),
    releaseId: z
      .string()
      .optional()
      .describe(
        'Optional release ID for patching versioned documents. If provided, the document in the specified release will be patched.',
      ),
  })
  .merge(BaseToolSchema)

type Params = z.infer<typeof PatchDocumentToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = getPublishedId(params.documentId as DocumentId)
  const documentId = params.releaseId
    ? getVersionId(publishedId, params.releaseId)
    : getDraftId(publishedId)

  const document = await client.getDocument(documentId)
  if (!document) {
    throw new Error(`Document with ID '${documentId}' not found`)
  }

  let patch = client.patch(documentId)

  for (const operation of params.operations) {
    switch (operation.op) {
      case 'set':
        patch = patch.set({[operation.path]: operation.value})
        break
      case 'unset':
        patch = patch.unset([operation.path])
        break
      case 'insert':
        patch = patch.insert(operation.position, operation.path, operation.items)
        break
      case 'inc':
        patch = patch.inc({[operation.path]: operation.amount})
        break
      case 'dec':
        patch = patch.dec({[operation.path]: operation.amount})
        break
      case 'setIfMissing':
        patch = patch.setIfMissing({[operation.path]: operation.value})
        break
    }
  }

  const updatedDocument = await patch.commit({autoGenerateArrayKeys: true})

  return createSuccessResponse('Document patched successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(updatedDocument),
  })
}

export const patchDocumentTool = withErrorHandling(tool, 'Error patching document')
