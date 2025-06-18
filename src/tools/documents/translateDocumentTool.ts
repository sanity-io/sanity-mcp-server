import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {stringToAgentPath} from '../../utils/path.js'
import {resolveDocumentId, resolveSchemaId} from '../../utils/resolvers.js'
import {getDocument} from '../../utils/document.js'
import type {DocumentId} from '@sanity/id-utils'
import {getCreationCheckpoint, getMutationCheckpoint} from '../../utils/checkpoint.js'
import type {Checkpoint} from '../../types/checkpoint.js'
import {processBulkOperation, createBulkOperationMessage} from '../../utils/bulk.js'

const LanguageSchema = z.object({
  id: z.string().describe('Language identifier (e.g., "en-US", "no", "fr")'),
  title: z.string().optional().describe('Human-readable language name'),
})

export const TranslateDocumentToolParams = BaseToolSchema.extend({
  documentIds: z
    .array(z.string().brand<DocumentId>())
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
  const checkpoints: Checkpoint[] = []

  const process = async (sourceDocumentId: string) => {
    const sourceDocument = await getDocument(sourceDocumentId as DocumentId, client)

    // Add checkpoint based on operation type
    const targetDocumentId =
      params.operation === 'create' ? resolveDocumentId(randomUUID()) : sourceDocumentId

    if (params.operation === 'create') {
      checkpoints.push(getCreationCheckpoint(targetDocumentId as DocumentId, client))
    } else {
      checkpoints.push(await getMutationCheckpoint(targetDocumentId as DocumentId, client))
    }

    return client.agent.action.translate({
      documentId: sourceDocumentId,
      targetDocument:
        params.operation === 'create'
          ? {operation: 'create', _id: targetDocumentId}
          : {operation: 'edit', _id: sourceDocumentId},
      languageFieldPath: sourceDocument.language ? ['language'] : undefined,
      fromLanguage: sourceDocument.language,
      toLanguage: params.language,
      schemaId: resolveSchemaId(params.workspaceName),
      target: params.paths
        ? params.paths.map((path) => ({path: stringToAgentPath(path)}))
        : undefined,
      protectedPhrases: params.protectedPhrases,
      async: runAsync,
    })
  }

  const {results, summary} = await processBulkOperation(params.documentIds, process)

  return createSuccessResponse(
    createBulkOperationMessage('documents', summary, runAsync),
    {
      results,
      summary,
    },
    checkpoints,
  )
}

export const translateDocumentTool = withErrorHandling(tool, 'Error translating document')
