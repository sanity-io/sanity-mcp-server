import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {BaseToolSchema, createToolClient, WorkspaceNameSchema} from '../../utils/tools.js'
import {resolveDocumentId, resolveSchemaId} from '../../utils/resolvers.js'

export const CreateVersionToolParams = BaseToolSchema.extend({
  documentId: z.string().describe('ID of the document to create a version for'),
  releaseId: z.string().describe('ID of the release to associate this version with'),
  instruction: z
    .string()
    .optional()
    .describe('Optional instruction for AI to modify the document while creating the version'),
  workspaceName: WorkspaceNameSchema,
})

type Params = z.infer<typeof CreateVersionToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)

  const release = await client.releases.get({releaseId: params.releaseId})
  if (!release) {
    throw new Error(`Release with ID '${params.releaseId}' not found`)
  }

  const publishedId = resolveDocumentId(params.documentId)
  const originalDocument = await client.getDocument(publishedId)
  if (!originalDocument) {
    throw new Error(`Document with ID '${params.documentId}' not found`)
  }

  const versionedId = resolveDocumentId(params.documentId, params.releaseId)

  let newDocument = await client.createVersion({
    document: {
      ...originalDocument,
      _id: versionedId,
    },
    releaseId: params.releaseId,
    publishedId,
  })

  if (params.instruction) {
    newDocument = await client.agent.action.transform({
      schemaId: resolveSchemaId(params.workspaceName),
      instruction: params.instruction,
      documentId: versionedId,
    })
  }

  return createSuccessResponse('Versioned document created successfully', {
    success: true,
    document: newDocument,
  })
}

export const createVersionTool = withErrorHandling(tool, 'Error creating document version')
