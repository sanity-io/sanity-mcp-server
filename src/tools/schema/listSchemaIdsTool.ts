import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../utils/response.js'
import {outdent} from 'outdent'

export const SCHEMA_DEPLOYMENT_INSTRUCTIONS = outdent`
  Your Sanity schema has not been deployed. In your Sanity project, run the following command:
  \`\`\`shell
  SANITY_CLI_SCHEMA_STORE_ENABLED=true npx sanity@latest schema deploy
  \`\`\`
`

export const ListSchemaIdsToolParams = z.object({})

type Params = z.infer<typeof ListSchemaIdsToolParams>

async function tool(_params?: Params) {
  const schemas = await sanityClient.fetch<{_id: string}[]>(
    '*[_type == "sanity.workspace.schema"]{ _id }',
  )

  if (!schemas || schemas.length === 0) {
    return createErrorResponse(SCHEMA_DEPLOYMENT_INSTRUCTIONS)
  }

  return createSuccessResponse(`Found ${schemas.length} schema IDs.`, {
    schemaIds: schemas.map((schema) => schema._id),
  })
}

export const listSchemaIdsTool = withErrorHandling(tool, 'Error fetching available schema IDs')
