import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {registerDatasetsTools} from './datasets/register.js'
import {registerDocumentsTools} from './documents/register.js'
import {registerEmbeddingsTools} from './embeddings/register.js'
import {registerGroqTools} from './groq/register.js'
import {registerProjectsTools} from './projects/register.js'
import {registerReleasesTools} from './releases/register.js'
import {registerSchemaTools} from './schema/register.js'
import { ServerOptions } from '../index.js'
import { makeBaseToolParamsSchema } from '../utils/tools.js'

export function registerAllTools(server: McpServer, serverOptions?: ServerOptions) {
  const baseSchema = makeBaseToolParamsSchema(serverOptions)
  
  registerGroqTools(server)
  registerDocumentsTools(server, baseSchema)
  registerProjectsTools(server)
  registerSchemaTools(server, baseSchema)
  registerDatasetsTools(server, baseSchema)
  registerReleasesTools(server, baseSchema)
  registerEmbeddingsTools(server, baseSchema)
}
