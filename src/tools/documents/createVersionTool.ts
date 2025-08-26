import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra, WorkspaceNameSchema} from '../../utils/tools.js'
import {
  resolveAiActionInstruction,
  resolveDocumentId,
  resolveSchemaId,
} from '../../utils/resolvers.js'
import type {Checkpoint} from '../../types/checkpoint.js'
import {getDocument} from '../../utils/document.js'
import {getCreationCheckpoint} from '../../utils/checkpoint.js'
import {processBulkOperation, createBulkOperationMessage} from '../../utils/bulk.js'

export const CreateVersionToolParams = z.object({
  documentIds: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe('Array of document IDs to create versions for (min 1, max 10)'),
  releaseId: z.string().describe('ID of the release to associate this version with'),
  instruction: z
    .string()
    .optional()
    .describe('Optional instruction for AI to modify the document while creating the version'),
  workspaceName: WorkspaceNameSchema,
})

type Params = z.infer<typeof CreateVersionToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const checkpoints: Checkpoint[] = []

  const release = await client.releases.get({releaseId: params.releaseId})
  if (!release) {
    throw new Error(`Release with ID '${params.releaseId}' not found`)
  }

  const process = async (documentId: string) => {
    const publishedId = resolveDocumentId(documentId, false)
    const versionId = resolveDocumentId(documentId, params.releaseId)
    const originalDocument = await getDocument(publishedId, client)

    checkpoints.push(getCreationCheckpoint(versionId, client))

    let newDocument = await client.createVersion({
      document: {
        ...originalDocument,
        _id: versionId,
      },
      releaseId: params.releaseId,
      publishedId,
    })

    if (params.instruction) {
      newDocument = await client.agent.action.transform({
        schemaId: resolveSchemaId(params.workspaceName),
        instruction: resolveAiActionInstruction(params.instruction),
        documentId: versionId,
      })
    }

    return {
      documentId,
      document: newDocument,
      success: true,
    }
  }

  const {results, summary} = await processBulkOperation(params.documentIds, process)

  return createSuccessResponse(
    createBulkOperationMessage('documents', summary, false),
    {
      results,
      summary,
    },
    checkpoints,
  )
}

export const createVersionTool = withErrorHandling(_tool, 'Error creating document version')
