import dotenv from 'dotenv'
import {z} from 'zod'
dotenv.config()

const EnvSchema = z.object({
  SANITY_API_TOKEN: z.string().describe('Sanity API token'),
  SANITY_PROJECT_ID: z.string().optional().describe('Optionally bind server to specific project'),
  SANITY_DATASET: z.string().optional().describe('Optionally bind server to specific dataset'),
  SANITY_API_HOST: z
    .string()
    .optional()
    .default('https://api.sanity.io')
    .describe('Sanity API host'),

  INTERNAL_REQUESTER_HEADERS: z
    .string()
    .optional()
    .transform((v) => (v ? JSON.parse(v) : undefined)),
  INTERNAL_REQUEST_TAG_PREFIX: z.string().optional(),
  INTERNAL_USE_PROJECT_HOSTNAME: z
    .union([z.literal('true').transform(() => true), z.literal('false').transform(() => false)])
    .optional(),

  MAX_TOOL_TOKEN_OUTPUT: z.coerce
    .number()
    .optional()
    .default(50000)
    .describe('Maximum tool token output'),
})

export const env = EnvSchema.safeParse(process.env)

if (!env.success) {
  console.error('Invalid environment variables', env.error.format())
  process.exit(1)
}
