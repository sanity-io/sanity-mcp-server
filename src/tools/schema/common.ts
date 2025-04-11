import {z} from 'zod'
import {DEFAULT_SCHEMA_ID} from '../../utils/manifest.js'

export const schemaIdSchema = z
  .string()
  .optional()
  .default(DEFAULT_SCHEMA_ID)
  .describe(
    'Schema manifest ID from dataset manifest, not document type. Get from context or listSchemaIdsTool',
  )
