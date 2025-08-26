import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {
  WorkspaceNameSchema,
  createToolClient,
  MaybeResourceParam,
  ToolCallExtra,
} from '../../utils/tools.js'
import {stringToAgentPath} from '../../utils/path.js'
import {
  resolveAiActionInstruction,
  resolveDocumentId,
  resolveSchemaId,
} from '../../utils/resolvers.js'
import {getMutationCheckpoint} from '../../utils/checkpoint.js'

export const TransformImageToolParams = z.object({
  documentId: z.string().describe('The ID of the document containing the image'),
  imagePath: z
    .string()
    .describe(
      'Path to the image field in the document (e.g., "image", "hero.image", "gallery[0].image")',
    ),
  instruction: z.string().describe('Instructions for transforming or generating the image'),
  operation: z
    .enum(['transform', 'generate'])
    .describe('Operation type: "transform" for existing images, "generate" for new images'),
  workspaceName: WorkspaceNameSchema,
})

type Params = z.infer<typeof TransformImageToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const documentId = resolveDocumentId(params.documentId)

  const checkpoint = await getMutationCheckpoint(documentId, client)

  const actionOptions = {
    documentId: documentId,
    instruction: resolveAiActionInstruction(params.instruction),
    schemaId: resolveSchemaId(params.workspaceName),
    target: {path: [...stringToAgentPath(params.imagePath), 'asset']},
  }

  if (params.operation === 'generate') {
    await client.agent.action.generate(actionOptions)
  } else {
    await client.agent.action.transform(actionOptions)
  }

  return createSuccessResponse(
    `Image ${params.operation}ed successfully`,
    {success: true},
    checkpoint,
  )
}

export const transformImageTool = withErrorHandling(_tool, 'Error transforming image')
