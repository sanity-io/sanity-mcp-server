import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {stringToAgentPath} from '../../utils/path.js'
import {resolveAiActionInstruction, resolveSchemaId} from '../../utils/resolvers.js'

export const TransformImageToolParams = BaseToolSchema.extend({
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

async function tool(params: Params) {
  const client = createToolClient(params)

  const actionOptions = {
    documentId: params.documentId,
    instruction: resolveAiActionInstruction(params.instruction),
    schemaId: resolveSchemaId(params.workspaceName),
    target: {path: [...stringToAgentPath(params.imagePath), 'asset']},
  }

  if (params.operation === 'generate') {
    await client.agent.action.generate(actionOptions)
  } else {
    await client.agent.action.transform(actionOptions)
  }

  return createSuccessResponse(`Image ${params.operation}ed successfully`, {
    success: true,
  })
}

export const transformImageTool = withErrorHandling(tool, 'Error transforming image')
