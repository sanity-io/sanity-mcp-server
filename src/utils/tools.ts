import { z } from 'zod'
import { createClient } from '@sanity/client'
import { getDefaultClientConfig } from '../config/sanity.js'
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import { ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js'
import { env } from '../config/env.js'
import {headers as headersMiddleware} from 'get-it/middleware'
import {requester as baseRequester} from '@sanity/client'

/**
 * Schema-related constants and schemas
 */
export const WorkspaceNameSchema = z
  .string()
  .describe(
    'Workspace name derived from the manifest, not document type. Derived from context or listSchemaWorkspacesTool',
  )

export type MaybeResourceParam = {
  resource?: {
    projectId?: string
    dataset?: string
  }
}

export type _BaseToolSchemaType =
  | z.ZodObject<{}>
  | z.ZodObject<{ resource: z.ZodObject<{ dataset: z.ZodString }> }>
  | z.ZodObject<{ resource: z.ZodObject<{ projectId: z.ZodString }> }>
  | z.ZodObject<{ resource: z.ZodObject<{ projectId: z.ZodString, dataset: z.ZodString }> }>

export type ToolCallExtra = RequestHandlerExtra<ServerRequest, ServerNotification>

// Creates the actual base tool schema that gets published in the MCP
export function makeBaseToolParamsSchema(serverOptions?: any): _BaseToolSchemaType {
  if (serverOptions?.projectId && serverOptions?.dataset) {
    return z.object({})
  }

  let ResourceSchema = z.object({})

  if (!serverOptions?.projectId) {
    ResourceSchema = ResourceSchema.extend({
      projectId: z.string().describe('The Sanity project id'),
    })
  }

  if (!serverOptions?.dataset) {
    ResourceSchema = ResourceSchema.extend({
      dataset: z.string().describe('The name of the dataset in the project'),
    })
  }

  return z.object({
    resource: ResourceSchema.describe('Resource information indicating which project id and dataset to target'),
  })
}

/**
 * Creates a Sanity client with the correct configuration based on resource parameters
 *
 * @param params - Tool parameters that may include a resource
 * @returns Configured Sanity client
 */
export function createToolClient(params: MaybeResourceParam, token?: string) {
  const clientConfig = getDefaultClientConfig()

  const projectId = params.resource?.projectId || env.data?.SANITY_PROJECT_ID
  if (!projectId) {
    throw new Error('Project ID is required')
  }

  const dataset = params.resource?.dataset || env.data?.SANITY_DATASET
  if (!dataset) {
    throw new Error('Dataset is required')
  }

  // Modify the Host header to be prefixed with the project ID for internal requests
  if (env.data?.INTERNAL_REQUESTER_HEADERS) {
    const requester = baseRequester.clone()
       const headerValues = { ...env.data.INTERNAL_REQUESTER_HEADERS }
    // If headers.Host exists and is not already prefixed with the project ID
    if (projectId && headerValues.Host && !headerValues.Host.startsWith(`${projectId}.`)) {
      headerValues.Host = `${projectId}.${headerValues.Host}`
    }
    requester.use(headersMiddleware(headerValues))
    clientConfig.requester = requester
  }


  clientConfig.projectId = projectId
  clientConfig.dataset = dataset
  clientConfig.token = token || env.data?.SANITY_API_TOKEN

  return createClient(clientConfig)
}
