import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import type {ManifestSchemaType} from '../../types/manifest.js'
import {formatSchema} from '../../utils/schema.js'
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {DEFAULT_SCHEMA_ID, SCHEMA_DEPLOYMENT_INSTRUCTIONS, schemaIdSchema} from './common.js'

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
  const schemaId = params.schemaId ?? DEFAULT_SCHEMA_ID
  const schemaDoc = await sanityClient.fetch(
    '*[_id == $schemaId && _type == "sanity.workspace.schema"][0]',
    {schemaId},
  )

  if (!schemaDoc?.schema) {
    return createErrorResponse(SCHEMA_DEPLOYMENT_INSTRUCTIONS)
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
