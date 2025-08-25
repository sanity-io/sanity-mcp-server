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

const ResourceSchema = z
  .object({
    projectId: z.string().describe('The Sanity project id'),
    dataset: z.string().describe('The name of the dataset in the project'),
  })
  .describe('Resource information indicating which project id and dataset to target')

export const BaseToolSchema = z.object({
  resource: ResourceSchema,
})

/**
 * Creates a Sanity client with the correct configuration based on resource parameters
 *
 * @param params - Tool parameters that may include a resource
 * @returns Configured Sanity client
 */
export function createToolClient<T extends z.infer<typeof BaseToolSchema>>(
  {resource}: T = {} as T,
): SanityClient {
  const clientConfig = getDefaultClientConfig()

  clientConfig.projectId = resource.projectId
  clientConfig.dataset = resource.dataset

  // Modify the Host header to be prefixed with the project ID for internal requests
  if (env.data?.INTERNAL_REQUESTER_HEADERS) {
    const requester = baseRequester.clone()
    const headerValues = { ...env.data.INTERNAL_REQUESTER_HEADERS }
    // If headers.Host exists and is not already prefixed with the project ID
    if (headerValues.Host && !headerValues.Host.startsWith(`${resource.projectId}.`)) {
      headerValues.Host = `${resource.projectId}.${headerValues.Host}`
    }
    requester.use(headersMiddleware(headerValues))
    clientConfig.requester = requester
  }

  return createClient(clientConfig)
}
