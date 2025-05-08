import {outdent} from 'outdent'
import {z} from 'zod'

export const SCHEMA_TYPE = 'system.schema'

export const DEFAULT_SCHEMA_ID = '_.schemas.default'

export const SCHEMA_DEPLOYMENT_INSTRUCTIONS = outdent`
  Your Sanity schema has not been deployed. In your Sanity project, run the following command:
  \`\`\`shell
  SANITY_CLI_SCHEMA_STORE_ENABLED=true npx sanity@latest schema deploy
  \`\`\`
`

export const schemaIdSchema = z
  .string()
  .regex(/^_\.schemas\..+$/, 'Schema ID must be in the format of `_.schemas.${string}`')
  .optional()
  .default(DEFAULT_SCHEMA_ID)
  .describe(
    'Schema manifest ID from dataset manifest, not document type. Get from context or listSchemaIdsTool',
  )
