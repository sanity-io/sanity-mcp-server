import {outdent} from 'outdent'
import {z} from 'zod'

export const DEFAULT_SCHEMA_ID = 'sanity.workspace.schema.default'

export const SCHEMA_DEPLOYMENT_INSTRUCTIONS = outdent`
  Your Sanity schema has not been deployed. In your Sanity project, run the following command:
  \`\`\`shell
  SANITY_CLI_SCHEMA_STORE_ENABLED=true npx sanity@latest schema deploy
  \`\`\`
`

export const schemaIdSchema = z
  .string()
  .optional()
  .default(DEFAULT_SCHEMA_ID)
  .describe(
    'Schema manifest ID from dataset manifest, not document type. Get from context or listSchemaIdsTool',
  )
