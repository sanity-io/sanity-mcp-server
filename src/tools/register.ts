import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {registerDatasetsTools} from './datasets/register.js'
import {registerDocumentsTools} from './documents/register.js'
import {registerEmbeddingsTools} from './embeddings/register.js'
import {registerGroqTools} from './groq/register.js'
import {registerProjectsTools} from './projects/register.js'
import {registerReleasesTools} from './releases/register.js'
import {registerSchemaTools} from './schema/register.js'

export function registerAllTools(server: McpServer) {
  registerGroqTools(server)
  registerDocumentsTools(server)
  registerProjectsTools(server)
  registerSchemaTools(server)
  registerDatasetsTools(server)
  registerReleasesTools(server)
  registerEmbeddingsTools(server)
}
