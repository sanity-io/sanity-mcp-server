import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {SCHEMA_DEPLOYMENT_INSTRUCTIONS} from './common.js'
import {createToolClient, MaybeResourceParam, ToolCallExtra} from '../../utils/tools.js'
import type {SchemaId} from '../../types/sanity.js'
import {pluralize} from '../../utils/formatters.js'

export const SCHEMA_TYPE = 'system.schema'

export const SCHEMA_ID_PREFIX: SchemaId = '_.schemas.'
export const DEFAULT_SCHEMA_ID: SchemaId = `${SCHEMA_ID_PREFIX}.default`

export const ListWorkspaceSchemasTool = z.object({})

type Params = z.infer<typeof ListWorkspaceSchemasTool>

export async function _tool(params: Params & MaybeResourceParam, extra?: ToolCallExtra) {
  const client = createToolClient(params, extra?.authInfo?.token)
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
  _tool,
  'Error fetching available schema IDs',
)
