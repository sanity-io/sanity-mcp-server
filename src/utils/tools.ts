import {z} from 'zod'
import {createClient, type SanityClient} from '@sanity/client'
import {requester as baseRequester} from '@sanity/client'
import {headers as headersMiddleware} from 'get-it/middleware'
import {env} from '../config/env.js'
import {getDefaultClientConfig} from '../config/sanity.js'

/**
 * Schema-related constants and schemas
 */
export const WorkspaceNameSchema = z
  .string()
  .describe(
    'Workspace name derived from the manifest, not document type. Derived from context or listSchemaWorkspacesTool',
  )

/**
 * Resources-related schemas
 */
const DatasetBaseToolSchema = z
  .object({
    target: z.literal('dataset').describe('Used when targeting studio resources'),
    projectId: z.string().describe('Unique identifier for the project'),
    dataset: z.string().describe('Name or identifier of the dataset'),
  })
  .describe('Represents a studio resource with its associated project and dataset identifiers')

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
export function createToolClient<T extends z.infer<typeof BaseToolSchema>>({
  resource,
}: T): SanityClient {
  const clientConfig = getDefaultClientConfig()

  if (env.data?.MCP_USER_ROLE !== 'agent') {
    return createClient(clientConfig)
  }

  if (resource?.target === 'dataset') {
    clientConfig.projectId = resource.projectId
    clientConfig.dataset = resource.dataset

    // Modify the Host header to be prefixed with the project ID for internal requests
    if (env.data.INTERNAL_REQUESTER_HEADERS) {
      const requester = baseRequester.clone()
      const headerValues = {...env.data.INTERNAL_REQUESTER_HEADERS}
      // If headers.Host exists and is not already prefixed with the project ID
      if (headerValues.Host && !headerValues.Host.startsWith(`${resource.projectId}.`)) {
        headerValues.Host = `${resource.projectId}.${headerValues.Host}`
      }
      requester.use(headersMiddleware(headerValues))
      clientConfig.requester = requester
    }

    return createClient(clientConfig)
  }

  return createClient(clientConfig)
}
