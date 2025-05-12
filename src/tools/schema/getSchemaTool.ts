import {z} from 'zod'
import type {ManifestSchemaType} from '../../types/manifest.js'
import {formatSchema} from '../../utils/schema.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {SCHEMA_DEPLOYMENT_INSTRUCTIONS} from './common.js'
import {
  DEFAULT_SCHEMA_ID,
  SCHEMA_TYPE,
  SchemaIdSchema,
  BaseToolSchema,
  createToolClient,
} from '../../utils/tools.js'

export const GetSchemaToolParams = z
  .object({
    type: z
      .string()
      .optional()
      .describe('Optional: Specific type name to fetch. If not provided, returns the full schema'),
    schemaId: SchemaIdSchema,
    lite: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Get a simplified version of the schema without field details. Useful for quick overviews.',
      ),
  })
  .merge(BaseToolSchema)

type Params = z.infer<typeof GetSchemaToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const schemaId = params.schemaId ?? DEFAULT_SCHEMA_ID
  const schemaDoc = await client.fetch('*[_id == $schemaId && _type == $schemaType][0]', {
    schemaType: SCHEMA_TYPE,
    schemaId,
  })

  if (!schemaDoc?.schema) {
    throw new Error(SCHEMA_DEPLOYMENT_INSTRUCTIONS)
  }

  let schema = JSON.parse(schemaDoc.schema) as ManifestSchemaType[]

  if (params.type) {
    const typeSchema = schema.filter((type) => type.name === params.type)
    if (typeSchema.length === 0) {
      throw new Error(`Type "${params.type}" not found in schema`)
    }
    schema = typeSchema
  }

  return createSuccessResponse(formatSchema(schema, schemaId, {lite: params.lite}))
}

export const getSchemaTool = withErrorHandling(tool, 'Error fetching schema overview')
