import {z} from 'zod'

export const McpRoleSchema = z
  .enum(['developer', 'editor', 'internal_agent_role'])
  .default('developer')

export type McpRole = z.infer<typeof McpRoleSchema>
