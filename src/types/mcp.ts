import {z} from 'zod'

export const McpRoleSchema = z.enum(['developer', 'editor']).default('developer')

export type McpRole = z.infer<typeof McpRoleSchema>
