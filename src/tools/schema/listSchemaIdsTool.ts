import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {SCHEMA_DEPLOYMENT_INSTRUCTIONS} from './common.js'
import {SCHEMA_TYPE, BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const ListSchemaIdsToolParams = z.object({}).merge(BaseToolSchema)

type Params = z.infer<typeof ListSchemaIdsToolParams>

async function tool(params: Params) {
  const client = createToolClient(params)
  const schemas = await client.fetch<{_id: string}[]>('*[_type == $schemaType]{ _id }', {
    schemaType: SCHEMA_TYPE,
  })

  if (!schemas || schemas.length === 0) {
    throw new Error(SCHEMA_DEPLOYMENT_INSTRUCTIONS)
  }

  return createSuccessResponse(`Found ${schemas.length} schema IDs.`, {
    schemaIds: schemas.map((schema) => schema._id),
  })
}

export const listSchemaIdsTool = withErrorHandling(tool, 'Error fetching available schema IDs')
