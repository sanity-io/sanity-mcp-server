import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'

export const ListSchemaIdsToolParams = z.object({})

type Params = z.infer<typeof ListSchemaIdsToolParams>

async function tool(_params?: Params) {
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

  return createSuccessResponse(`Found ${schemas.length} schema IDs.`, {
    schemaIds: schemas.map((schema) => schema._id),
  })
}

export const listSchemaIdsTool = withErrorHandling(tool, 'Error fetching available schema IDs')
