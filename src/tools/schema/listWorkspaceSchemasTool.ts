import type {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {SCHEMA_DEPLOYMENT_INSTRUCTIONS} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'
import type {SchemaId} from '../../types/sanity.js'
import {pluralize} from '../../utils/formatters.js'

export const SCHEMA_TYPE = 'system.schema'

export const SCHEMA_ID_PREFIX: SchemaId = '_.schemas.'
export const DEFAULT_SCHEMA_ID: SchemaId = `${SCHEMA_ID_PREFIX}.default`

export const ListWorkspaceSchemasTool = BaseToolSchema.extend({})

type Params = z.infer<typeof ListWorkspaceSchemasTool>

async function tool(params: Params) {
  const client = createToolClient(params)
  const schemas = await client.fetch<{_id: string}[]>('*[_type == $schemaType]{ _id }', {
    schemaType: SCHEMA_TYPE,
  })

  if (!schemas || schemas.length === 0) {
    throw new Error(SCHEMA_DEPLOYMENT_INSTRUCTIONS)
  }

  return createSuccessResponse(`Found ${schemas.length} ${pluralize(schemas, 'workspace')}`, {
    workspaceNames: schemas.map((schema) => {
      // Extract only the last part of id.
      return schema._id.substring(SCHEMA_ID_PREFIX.length)
    }),
  })
}

export const listWorkspaceSchemasTool = withErrorHandling(
  tool,
  'Error fetching available schema IDs',
)
