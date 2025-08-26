import {z} from 'zod'
import type {ManifestSchemaType} from '../../types/manifest.js'
import {formatSchema} from '../../utils/schema.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {SCHEMA_DEPLOYMENT_INSTRUCTIONS} from './common.js'
import {
  MaybeResourceParam,
  ToolCallExtra,
  WorkspaceNameSchema,
  createToolClient,
} from '../../utils/tools.js'
import {resolveSchemaId} from '../../utils/resolvers.js'

export const GetSchemaToolParams = z.object({
  workspaceName: WorkspaceNameSchema,
  type: z
    .string()
    .optional()
    .describe(
      'Optional: Specific type name to fetch. If not provided, returns the full schema without detailed field definitions. Full field definitions are only available when requesting a specific type.',
    ),
})

type Params = z.infer<typeof GetSchemaToolParams>

async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
  const schemaId = resolveSchemaId(params.workspaceName)
  const schemaDoc = await client.fetch('*[_id == $schemaId][0]', {schemaId})

  if (!schemaDoc?.schema) {
    throw new Error(SCHEMA_DEPLOYMENT_INSTRUCTIONS)
  }

  let schema = JSON.parse(schemaDoc.schema) as ManifestSchemaType[]

  if (params.type && params.type.trim() !== '') {
    const typeSchema = schema.filter((type) => type.name === params.type)
    if (typeSchema.length === 0) {
      throw new Error(`Type "${params.type}" not found in schema`)
    }
    schema = typeSchema
  }
  const hasType = Boolean(params.type) // Skip full field definitions if no type specified to avoid blowing up the context window
  return createSuccessResponse(formatSchema(schema, schemaId, {lite: hasType === false}))
}

export const getSchemaTool = withErrorHandling(_tool, 'Error fetching schema overview')
