import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import type {ManifestSchemaType} from '../../types/manifest.js'
import {formatSchema} from '../../utils/schema.js'
import {createErrorResponse, withErrorHandling} from '../../utils/response.js'

const DEFAULT_SCHEMA_ID = 'sanity.workspace.schema.default'

export const GetSchemaToolParams = z.object({
  type: z
    .string()
    .optional()
    .describe('Optional: Specific type name to fetch. If not provided, returns the full schema'),
  schemaId: z.string().default(DEFAULT_SCHEMA_ID).optional().describe('The schema ID to fetch'),
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
  const schemaDoc = await sanityClient.fetch('*[_id == $schemaId][0]', {
    schemaId: params.schemaId ?? DEFAULT_SCHEMA_ID,
  })

  if (!schemaDoc?.schema) {
    return createErrorResponse(
      `Schema ID "${params.schemaId}" not found. Please use the list_schema_ids tool to see available schemas.`,
    )
  }

  let schema = JSON.parse(schemaDoc.schema) as ManifestSchemaType[]

  if (params.type) {
    const typeSchema = schema.filter((type) => type.name === params.type)
    if (typeSchema.length === 0) {
      throw new Error(`Type "${params.type}" not found in schema`)
    }
    schema = typeSchema
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: formatSchema(schema, {lite: params.lite}) as string,
      },
    ],
  }
}

export const getSchemaTool = withErrorHandling(tool, 'Error fetching schema overview')
