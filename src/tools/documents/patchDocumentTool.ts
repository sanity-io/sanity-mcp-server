import {z} from 'zod'
import {get, set} from 'lodash-es'
import {sanityClient} from '../../config/sanity.js'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {type DocumentId, getDraftId, getPublishedId, getVersionId} from '@sanity/id-utils'
import {schemaIdSchema} from '../schema/common.js'
import {DEFAULT_SCHEMA_ID, getSchemaById} from '../../utils/manifest.js'
import {createZodSchemaFromSanitySchema} from '../../utils/zod-sanity-schema.js'
import type {DocumentLike} from '../../types/sanity.js'

const SetOperation = z.object({
  op: z.literal('set'),
  path: z.string().describe('The path to set, e.g. "title" or "author.name"'),
  value: z.unknown().describe('The value to set at the specified path'),
})

const UnsetOperation = z.object({
  op: z.literal('unset'),
  path: z.string().describe('The path to unset, e.g. "description" or "metadata.keywords"'),
})

const InsertOperation = z.object({
  op: z.literal('insert'),
  position: z.enum(['before', 'after', 'replace']),
  path: z
    .string()
    .describe('The path to the array or element, e.g. "categories" or "categories[0]"'),
  items: z.array(z.unknown()).describe('The items to insert'),
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
  value: z.unknown().describe('The value to set if the path is missing'),
})

const PatchOperation = z.discriminatedUnion('op', [
  SetOperation,
  UnsetOperation,
  InsertOperation,
  IncOperation,
  DecOperation,
  SetIfMissingOperation,
])

export const PatchDocumentToolParams = z.object({
  documentId: z.string().describe('The ID of the document to patch'),
  operations: z.array(PatchOperation).describe('Array of patch operations to apply'),
  releaseId: z
    .string()
    .optional()
    .describe(
      'Optional release ID for patching versioned documents. If provided, the document in the specified release will be patched.',
    ),
  schemaId: schemaIdSchema,
})

type Params = z.infer<typeof PatchDocumentToolParams>

async function tool(params: Params) {
  const publishedId = getPublishedId(params.documentId as DocumentId)
  const documentId = params.releaseId
    ? getVersionId(publishedId, params.releaseId)
    : getDraftId(publishedId)

  const document = await sanityClient.getDocument(documentId)
  if (!document) {
    return createErrorResponse(`Document with ID '${documentId}' not found`)
  }

  const schema = await getSchemaById(params.schemaId ?? DEFAULT_SCHEMA_ID)
  const zodSchemas = createZodSchemaFromSanitySchema(schema)

  const documentType = document._type
  const documentSchema = zodSchemas[documentType]

  let patch = sanityClient.patch(documentId)
  let simulatedDoc: DocumentLike = structuredClone(document)

  for (const operation of params.operations) {
    try {
      switch (operation.op) {
        case 'set': {
          const tempDoc = structuredClone(simulatedDoc)
          set(tempDoc, operation.path, operation.value)
          documentSchema.parse(tempDoc)
          simulatedDoc = tempDoc
          patch = patch.set({[operation.path]: operation.value})
          break
        }

        case 'unset': {
          const tempDoc = structuredClone(simulatedDoc)
          set(tempDoc, operation.path, undefined)
          documentSchema.parse(tempDoc)
          simulatedDoc = tempDoc
          patch = patch.unset([operation.path])
          break
        }

        case 'insert': {
          const pathValue = get(simulatedDoc, operation.path)

          if (
            !Array.isArray(pathValue) &&
            !Array.isArray(get(simulatedDoc, operation.path.replace(/\[\d+\]$/, '')))
          ) {
            return createErrorResponse(
              `Insert operation target '${operation.path}' is not an array`,
            )
          }

          const tempDoc = structuredClone(simulatedDoc)
          let arrayPath = operation.path
          let index = -1

          const indexMatch = operation.path.match(/\[(\d+)\]$/)
          if (indexMatch) {
            index = Number.parseInt(indexMatch[1])
            arrayPath = operation.path.substring(0, operation.path.lastIndexOf('['))
          }

          const arrayValue = get(tempDoc, arrayPath)
          const array = Array.isArray(arrayValue) ? [...arrayValue] : []

          if (operation.position === 'before' && index !== -1) {
            array.splice(index, 0, ...operation.items)
          } else if (operation.position === 'after' && index !== -1) {
            array.splice(index + 1, 0, ...operation.items)
          } else if (operation.position === 'replace' && index !== -1) {
            array.splice(index, 1, ...operation.items)
          } else {
            array.push(...operation.items)
          }

          set(tempDoc, arrayPath, array)
          documentSchema.parse(tempDoc)
          simulatedDoc = tempDoc
          patch = patch.insert(operation.position, operation.path, operation.items)
          break
        }

        case 'inc': {
          const currentValue = get(simulatedDoc, operation.path)

          if (typeof currentValue !== 'number' && currentValue !== undefined) {
            return createErrorResponse(`Inc operation target '${operation.path}' is not a number`)
          }

          const tempDoc = structuredClone(simulatedDoc)
          set(tempDoc, operation.path, (currentValue || 0) + operation.amount)
          documentSchema.parse(tempDoc)
          simulatedDoc = tempDoc
          patch = patch.inc({[operation.path]: operation.amount})
          break
        }

        case 'dec': {
          const currentValue = get(simulatedDoc, operation.path)

          if (typeof currentValue !== 'number' && currentValue !== undefined) {
            return createErrorResponse(`Dec operation target '${operation.path}' is not a number`)
          }

          const tempDoc = structuredClone(simulatedDoc)
          set(tempDoc, operation.path, (currentValue || 0) - operation.amount)
          documentSchema.parse(tempDoc)
          simulatedDoc = tempDoc
          patch = patch.dec({[operation.path]: operation.amount})
          break
        }

        case 'setIfMissing': {
          const currentValue = get(simulatedDoc, operation.path)

          if (currentValue === undefined) {
            const tempDoc = structuredClone(simulatedDoc)
            set(tempDoc, operation.path, operation.value)
            documentSchema.parse(tempDoc)
            simulatedDoc = tempDoc
          }

          patch = patch.setIfMissing({[operation.path]: operation.value})
          break
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Invalid patch operation: ${operation.op} on path '${operation.path}' would result in an invalid document: ${error.message}`,
        )
      }
      throw error
    }
  }

  const updatedDocument = await patch.commit({autoGenerateArrayKeys: true})

  return createSuccessResponse('Document patched successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(updatedDocument),
  })
}

export const patchDocumentTool = withErrorHandling(tool, 'Error patching document')
