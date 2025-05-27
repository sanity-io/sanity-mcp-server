import dotenv from 'dotenv'
import {z} from 'zod'
dotenv.config()

const CommonEnvSchema = z.object({
  SANITY_API_TOKEN: z.string().describe('Sanity API token'),
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

const DefaultSchema = z
  .object({
    MCP_USER_ROLE: z.enum(['developer', 'editor']),
    SANITY_PROJECT_ID: z.string().describe('Sanity project ID'),
    SANITY_DATASET: z.string().describe('The dataset'),
  })
  .merge(CommonEnvSchema)

const AgentSchema = z
  .object({
    MCP_USER_ROLE: z.literal('internal_agent_role'),
  })
  .merge(CommonEnvSchema)

const EnvSchema = z.discriminatedUnion('MCP_USER_ROLE', [DefaultSchema, AgentSchema])

export const env = EnvSchema.safeParse(process.env)

if (!env.success) {
  console.error('Invalid environment variables', env.error.format())
  process.exit(1)
}
