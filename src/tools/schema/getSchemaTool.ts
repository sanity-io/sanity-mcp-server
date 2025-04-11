import {z} from 'zod'
import {formatSchema} from '../../utils/schema.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {schemaIdSchema} from './common.js'
import {DEFAULT_SCHEMA_ID, getSchemaById} from '../../utils/manifest.js'

export const GetSchemaToolParams = z.object({
  type: z
    .string()
    .optional()
    .describe('Optional: Specific type name to fetch. If not provided, returns the full schema'),
  schemaId: schemaIdSchema,
  lite: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Get a simplified version of the schema without field details. Useful for quick overviews.',
    ),
})

type Params = z.infer<typeof GetSchemaToolParams>

async function tool(params: Params) {
  const effectiveSchemaId = params.schemaId ?? DEFAULT_SCHEMA_ID
  let schema = await getSchemaById(effectiveSchemaId)

  if (params.type) {
    const typeSchema = schema.filter((type) => type.name === params.type)
    if (typeSchema.length === 0) {
      throw new Error(`Type "${params.type}" not found in schema`)
    }
    schema = typeSchema
  }

  return createSuccessResponse(formatSchema(schema, effectiveSchemaId, {lite: params.lite}))
}

export const getSchemaTool = withErrorHandling(tool, 'Error fetching schema overview')
