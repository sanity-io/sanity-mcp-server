import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import type {ManifestSchemaType} from '../../types/manifest.js'
import {formatSchema} from '../../utils/schema.js'

export const GetSchemaToolParams = z.object({
  type: z
    .string()
    .optional()
    .describe('Optional: Specific type name to fetch. If not provided, returns the full schema'),
  schemaId: z
    .string()
    .optional()
    .default('sanity.workspace.schema.default')
    .describe('The schema ID to fetch'),
})

type Params = z.infer<typeof GetSchemaToolParams>

export async function getSchemaTool(params: Params) {
  try {
    const schemaString: string = await sanityClient.fetch('*[_id == $schemaId][0].schema', {
      schemaId: params.schemaId,
    })

    let schema = JSON.parse(schemaString) as ManifestSchemaType[]

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
          text: formatSchema(schema) as string,
        },
      ],
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error fetching schema overview: ${error}`,
        },
      ],
    }
  }
}
