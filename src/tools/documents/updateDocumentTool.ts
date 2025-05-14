import {z} from 'zod'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {type DocumentId, getPublishedId} from '@sanity/id-utils'
import {getVersionId} from '@sanity/client/csm'
import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import type {GenerateInstruction} from '@sanity/client'
import {stringToPath} from '../../utils/path.js'
import {resolveSchemaId} from '../../utils/resolvers.js'

export const UpdateDocumentToolParams = z
  .object({
    documentId: z.string().describe('The ID of the document to update'),
    instruction: z.string().describe('Instruction for AI to update the document content'),
    workspaceName: WorkspaceNameSchema,
    paths: z
      .array(z.string())
      .optional()
      .describe(
        'Target field paths for the instruction. Specifies fields to update. Should always be set if you want to update specific fields. If not set, targets the whole document. ie: ["field", "array[_key==\"key\"]"] where "key" is a json match',
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
  .merge(BaseToolSchema)

type Params = z.infer<typeof UpdateDocumentToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = getPublishedId(params.documentId as DocumentId)
  const documentId = params.releaseId
    ? getVersionId(publishedId, params.releaseId)
    : params.documentId

  const instructOptions: GenerateInstruction = {
    documentId,
    instruction: params.instruction,
    schemaId: resolveSchemaId(params.workspaceName),
    target: params.paths ? params.paths.map((path) => ({path: stringToPath(path)})) : undefined,
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
    document: truncateDocumentForLLMOutput(updatedDocument),
  })
}

export const updateDocumentTool = withErrorHandling(tool, 'Error updating document')
