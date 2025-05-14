import type {TranslateDocument} from '@sanity/client'
import {z} from 'zod'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {stringToPath} from '../../utils/path.js'
import {resolveSchemaId} from '../../utils/resolvers.js'

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
})

const TargetDocumentSchema = z.discriminatedUnion('operation', [
  EditTargetSchema,
  CreateTargetSchema,
])

export const TranslateDocumentToolParams = z
  .object({
    sourceDocument: z.string().describe('The ID of the source document to translate'),
    targetDocument: TargetDocumentSchema.optional().describe(
      'Optional target document configuration if you want to translate to a different document',
    ),
    language: LanguageSchema.describe('Target language to translate to'),
    workspaceName: WorkspaceNameSchema,
    paths: z
      .array(z.string())
      .optional()
      .describe(
        'Target field paths for the translation. Specifies fields to translate. Should always be set if you want to translate specific fields. If not set, targets the whole document. ie: ["field", "array[_key==\"key\"]"] where "key" is a json match',
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
  .merge(BaseToolSchema)

type Params = z.infer<typeof TranslateDocumentToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  // First check if source document exists
  const sourceDocument = await client.getDocument(params.sourceDocument)
  if (!sourceDocument) {
    throw new Error(`Source document with ID '${params.sourceDocument}' not found`)
  }

  const translateOptions: TranslateDocument = {
    documentId: params.sourceDocument,
    // Default to creating a new document unless specifically specified
    targetDocument: params.targetDocument || {operation: 'create'},

    languageFieldPath: sourceDocument.language ? ['language'] : undefined,
    fromLanguage: sourceDocument.language,
    toLanguage: params.language,
    schemaId: resolveSchemaId(params.workspaceName),
    target: params.paths ? params.paths.map((path) => ({path: stringToPath(path)})) : undefined,
    protectedPhrases: params.protectedPhrases,
  }

  if (params.async === true) {
    await client.agent.action.translate({
      ...translateOptions,
      async: true,
    })

    return createSuccessResponse('Document translation initiated in background', {
      success: true,
      document: {_id: params.sourceDocument},
    })
  }

  const translatedDocument = await client.agent.action.translate(translateOptions)

  return createSuccessResponse('Document translated successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(translatedDocument),
  })
}

export const translateDocumentTool = withErrorHandling(tool, 'Error translating document')
