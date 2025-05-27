import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {WorkspaceNameSchema, BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {stringToAgentPath} from '../../utils/path.js'
import {resolveSchemaId} from '../../utils/resolvers.js'

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
  generateAltText: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to also include alt text field in the transformation'),
})

type Params = z.infer<typeof TransformImageToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)

  const sourceDocument = await client.getDocument(params.documentId)
  if (!sourceDocument) {
    throw new Error(`Document with ID '${params.documentId}' not found`)
  }

  const imagePath = stringToAgentPath(params.imagePath)
  const target = params.generateAltText
    ? {path: imagePath, include: ['asset', 'alt']}
    : {path: [...imagePath, 'asset']}

  const action =
    params.operation === 'generate' ? client.agent.action.generate : client.agent.action.transform

  await action({
    documentId: params.documentId,
    instruction: params.instruction,
    schemaId: resolveSchemaId(params.workspaceName),
    target,
  })

  return createSuccessResponse(`Image ${params.operation}ed successfully`, {
    success: true,
  })
}

export const transformImageTool = withErrorHandling(tool, 'Error transforming image')
