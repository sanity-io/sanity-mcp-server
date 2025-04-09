import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'

export const ListSchemaIdsToolParams = z.object({})

type Params = z.infer<typeof ListSchemaIdsToolParams>

export async function listSchemaIdsTool(_params?: Params) {
  try {
    const schemas = await sanityClient.fetch<{_id: string}[]>(
      '*[_type == "sanity.workspace.schema"]{ _id }',
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

    const message = formatResponse(`Found ${schemas.length} schema IDs.`, {
      schemaIds: schemas.map((schema) => schema._id),
    })

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
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
