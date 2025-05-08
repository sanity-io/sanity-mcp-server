import type {TranslateDocument} from '@sanity/client'
import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {schemaIdSchema} from '../schema/common.js'
import {stringToPath} from '../../utils/path.js'

const LanguageSchema = z.object({
  id: z.string().describe('Language identifier (e.g., "en-US", "no", "fr")'),
  title: z.string().optional().describe('Human-readable language name'),
})

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

export const TranslateDocumentToolParams = z.object({
  documentId: z.string().describe('The ID of the source document to translate'),
  language: LanguageSchema.describe('Target language to translate to'),
  schemaId: schemaIdSchema,

  paths: z
    .array(z.string())
    .optional()
    .describe(
      'Optional target field paths for the translation. If not set, translates the whole document.',
    ),
  targetDocument: TargetDocumentSchema.optional().describe(
    'Optional target document configuration if you want to translate to a different document',
  ),
  protectedPhrases: z
    .array(z.string())
    .optional()
    .describe('List of phrases that should not be translated'),
  async: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Set to true for background processing when translating multiple documents for better performance.',
    ),
})

type Params = z.infer<typeof TranslateDocumentToolParams>

async function tool(params: Params) {
  // First check if source document exists
  const sourceDocument = await sanityClient.getDocument(params.documentId)
  if (!sourceDocument) {
    return createErrorResponse(`Source document with ID '${params.documentId}' not found`)
  }

  const translateOptions: TranslateDocument = {
    documentId: params.documentId,
    schemaId: params.schemaId,
    toLanguage: params.language,
    target: params.paths ? params.paths.map((path) => ({path: stringToPath(path)})) : undefined,
    targetDocument: params.targetDocument,
    protectedPhrases: params.protectedPhrases,
  }

  if (params.async === true) {
    await sanityClient.agent.action.translate({
      ...translateOptions,
      async: true,
    })

    return createSuccessResponse('Document translation initiated in background', {
      success: true,
      document: {_id: params.documentId},
    })
  }

  const translatedDocument = await sanityClient.agent.action.translate(translateOptions)

  return createSuccessResponse('Document translated successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(translatedDocument),
  })
}

export const translateDocumentTool = withErrorHandling(tool, 'Error translating document')
