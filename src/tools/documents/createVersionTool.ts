import {z} from 'zod'
import {truncateDocumentForLLMOutput} from '../../utils/formatters.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {type DocumentId, getDraftId, getPublishedId, getVersionId} from '@sanity/id-utils'
import {BaseToolSchema, createToolClient, WorkspaceNameSchema} from '../../utils/tools.js'
import {resolveSchemaId} from '../../utils/resolvers.js'

export const CreateVersionToolParams = z
  .object({
    documentId: z.string().describe('ID of the document to create a version for'),
    releaseId: z.string().describe('ID of the release to associate this version with'),
    instruction: z
      .string()
      .optional()
      .describe('Optional instruction for AI to modify the document while creating the version'),
    workspaceName: WorkspaceNameSchema,
  })
  .merge(BaseToolSchema)

type Params = z.infer<typeof CreateVersionToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const publishedId = getPublishedId(params.documentId as DocumentId)
  const versionId = getVersionId(publishedId, params.releaseId)

  const [requestedDoc, draftDoc] = await Promise.all([
    client.getDocument(params.documentId).catch(() => null),
    client.getDocument(getDraftId(publishedId)).catch(() => null),
  ])

  const originalDocument = requestedDoc || draftDoc
  if (!originalDocument) {
    throw new Error(`Document with ID '${params.documentId}' not found`)
  }

  let newDocument = await client.request({
    uri: `/data/actions/${client.config().dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.document.version.create',
          publishedId,
          document: {
            ...originalDocument,
            _id: versionId,
          },
        },
      ],
    },
  })

  if (params.instruction) {
    newDocument = await client.agent.action.generate({
      documentId: versionId,
      schemaId: resolveSchemaId(params.workspaceName),
      instruction: params.instruction,
    })
  }

  return createSuccessResponse('Version created and modified with AI successfully', {
    success: true,
    document: truncateDocumentForLLMOutput(newDocument),
  })
}

export const createVersionTool = withErrorHandling(tool, 'Error creating document version')
