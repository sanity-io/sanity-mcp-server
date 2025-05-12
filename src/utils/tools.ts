import {z} from 'zod'
import type {SanityClient} from '@sanity/client'
import type {SchemaId} from '../types/sanity.js'
import {sanityClient} from '../config/sanity.js'
import {env} from '../config/env.js'

/**
 * Schema-related constants and schemas
 */
export const SCHEMA_TYPE = 'system.schema'

export const DEFAULT_SCHEMA_ID: SchemaId = '_.schemas.default'

export const SchemaIdSchema = z
  .string()
  .regex(/^_\.schemas\..+$/, 'Schema ID must be in the format of `_.schemas.${string}`')
  .optional()
  .default(DEFAULT_SCHEMA_ID)
  .describe(
    'Schema manifest ID from dataset manifest, not document type. Get from context or listSchemaIdsTool',
  )

/**
 * Resources-related schemas
 */
const DatasetBaseToolSchema = z
  .object({
    target: z.literal('dataset').describe('Target identifier for dataset resources'),
    projectId: z.string().describe('Unique identifier for the project'),
    dataset: z.string().describe('Name or identifier of the dataset'),
  })
  .describe('Represents a dataset resource with its associated project and dataset identifiers')

const ResourceSchema = z
  .discriminatedUnion('target', [DatasetBaseToolSchema])
  .describe('Union type for different resource types, discriminated by the "target" field')

export const BaseToolSchema = z.object({resource: ResourceSchema})

// export const BaseToolSchema =
//   env.data?.MCP_USER_ROLE === 'agent'
//     ? z.object({
//         resource: ResourceSchema,
//       })
//     : z.object({})

/**
 * Creates a Sanity client with the correct configuration based on resource parameters
 *
 * @param params - Tool parameters that may include a resource
 * @returns Configured Sanity client
 */
export function createToolClient<T extends {resource?: {target: string}}>(
  params?: T,
): SanityClient {
  if (!params?.resource || env.data?.MCP_USER_ROLE !== 'agent') {
    return sanityClient
  }

  const resource = params.resource
  if (resource.target === 'dataset') {
    const datasetResource = resource as z.infer<typeof DatasetBaseToolSchema>
    return sanityClient.withConfig({
      projectId: datasetResource.projectId,
      dataset: datasetResource.dataset,
    })
  }

  return sanityClient
}
