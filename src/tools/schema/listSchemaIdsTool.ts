import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'

export const ListSchemaIdsToolParams = z.object({})

type Params = z.infer<typeof ListSchemaIdsToolParams>

interface SchemaDocument {
  _id: string
  _type: string
}

export async function listSchemaIdsTool(_params: Params) {
  try {
    const schemas = await sanityClient.fetch<SchemaDocument[]>(
      '*[_type == "sanity.workspace.schema"]{ _id, _type }',
    )

    if (!schemas || schemas.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No schema documents found in the dataset.',
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `Available schema IDs:\n${schemas.map((schema) => `- ${schema._id}`).join('\n')}`,
        },
      ],
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error fetching available schema IDs: ${error}`,
        },
      ],
    }
  }
}
