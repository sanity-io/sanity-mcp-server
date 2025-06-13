import type {TranslateDocument} from '@sanity/client'
import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {stringToAgentPath} from '../../utils/path.js'
import {resolveSchemaId} from '../../utils/resolvers.js'

const LanguageSchema = z.object({
  id: z.string().describe('Language identifier (e.g., "en-US", "no", "fr")'),
  title: z.string().optional().describe('Human-readable language name'),
})

export const TranslateDocumentToolParams = BaseToolSchema.extend({
  documentIds: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe('Array of source document IDs to translate (min 1, max 10)'),
  language: LanguageSchema.describe('Target language to translate to'),
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
      'Target field paths for the translation. Specifies fields to translate. Should always be set if you want to translate specific fields. If not set, targets the whole document. ie: ["field", "array[_key==\"key\"]"] where "key" is a json match',
    ),
  protectedPhrases: z
    .array(z.string())
    .optional()
    .describe(
      'List of phrases that should not be translated (e.g., brand names like "Nike", company names like "Microsoft", product names, proper nouns, technical terms, etc.)',
    ),
})

type Params = z.infer<typeof TranslateDocumentToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)

  const runAsync = params.documentIds?.length > 1

  const process = async (sourceDocumentId: string) => {
    const sourceDocument = await client.getDocument(sourceDocumentId)
    if (!sourceDocument) {
      throw new Error(`Source document with ID '${sourceDocumentId}' not found`)
    }

    // Capture document info before translation
    const documentBeforeChange = {
      _id: sourceDocument._id,
      _rev: sourceDocument._rev,
    }

    const translateOptions: TranslateDocument = {
      documentId: sourceDocumentId,
      targetDocument:
        params.operation === 'create'
          ? {operation: 'create'}
          : {operation: 'edit', _id: sourceDocumentId},
      languageFieldPath: sourceDocument.language ? ['language'] : undefined,
      fromLanguage: sourceDocument.language,
      toLanguage: params.language,
      schemaId: resolveSchemaId(params.workspaceName),
      target: params.paths
        ? params.paths.map((path) => ({path: stringToAgentPath(path)}))
        : undefined,
      protectedPhrases: params.protectedPhrases,
    }

    const document = await client.agent.action.translate({
      ...translateOptions,
      async: runAsync,
    })

    return {
      sourceDocumentId,
      document,
      documentBeforeChange,
      success: true,
      async: true,
    }
  }

  const results = await Promise.all(
    params.documentIds.map(async (sourceDocumentId) => {
      try {
        return await process(sourceDocumentId)
      } catch (error) {
        return {
          sourceDocumentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }),
  )

  const successCount = results.filter((r) => r.success).length
  const failureCount = results.length - successCount
  const message = runAsync
    ? `Initiated translation for ${params.documentIds.length} documents in background: ${successCount} successful, ${failureCount} failed`
    : `Translated ${params.documentIds.length} documents: ${successCount} successful, ${failureCount} failed`

  // Collect document changes from successful translations
  const documentChanges = results
    .filter((r) => r.success && 'documentBeforeChange' in r)
    .map((r) => (r as any).documentBeforeChange)

  return createSuccessResponse(
    message,
    {
      results,
      summary: {
        total: params.documentIds.length,
        successful: successCount,
        failed: failureCount,
      },
    },
    documentChanges,
  )
}

export const translateDocumentTool = withErrorHandling(tool, 'Error translating document')
