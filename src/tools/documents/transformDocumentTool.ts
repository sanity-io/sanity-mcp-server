import type {TransformDocument} from '@sanity/client'
import {z} from 'zod'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {stringToPath} from '../../utils/path.js'
import {resolveSchemaId} from '../../utils/resolvers.js'

const EditTargetSchema = z.object({
  operation: z.literal('edit'),
  _id: z.string(),
})

const CreateTargetSchema = z.object({
  operation: z.literal('create'),
  _id: z.string().optional(),
})

const CreateIfNotExistsTargetSchema = z.object({
  operation: z.literal('createIfNotExists'),
  _id: z.string(),
})

const CreateOrReplaceTargetSchema = z.object({
  operation: z.literal('createOrReplace'),
  _id: z.string(),
})

const TargetDocumentSchema = z.discriminatedUnion('operation', [
  EditTargetSchema,
  CreateTargetSchema,
  CreateIfNotExistsTargetSchema,
  CreateOrReplaceTargetSchema,
])

export const TransformDocumentToolParams = BaseToolSchema.extend({
  documentId: z.string().describe('The ID of the source document to transform'),
  instruction: z.string().describe('Instructions for transforming the document content'),
  workspaceName: WorkspaceNameSchema,
  paths: z
    .array(z.string())
    .optional()
    .describe(
      'Optional target field paths for the transformation. If not set, transforms the whole document.',
    ),
  targetDocument: TargetDocumentSchema.optional().describe(
    'Optional target document configuration if you want to transform to a different document',
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

async function tool(params: Params) {
  const client = createToolClient(params)
  // First check if source document exists
  const sourceDocument = await client.getDocument(params.documentId)
  if (!sourceDocument) {
    throw new Error(`Source document with ID '${params.documentId}' not found`)
  }

  const transformOptions: TransformDocument = {
    documentId: params.documentId,
    instruction: params.instruction,
    schemaId: resolveSchemaId(params.workspaceName),
    target: params.paths ? params.paths.map((path) => ({path: stringToPath(path)})) : undefined,
    targetDocument: params.targetDocument,
    instructionParams: params.instructionParams,
  }

  if (params.async === true) {
    await client.agent.action.transform({
      ...transformOptions,
      async: true,
    })

    return createSuccessResponse('Document transformation initiated in background', {
      success: true,
      document: {_id: params.documentId},
    })
  }

  const transformedDocument = await client.agent.action.transform(transformOptions)

  return createSuccessResponse('Document transformed successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(transformedDocument),
  })
}

export const transformDocumentTool = withErrorHandling(tool, 'Error transforming document')
