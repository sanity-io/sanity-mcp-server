import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'
import {registerConfigTools} from './config/register.js'
import {enforceInitialContextMiddleware} from './context/middleware.js'
import {registerContextTools} from './context/register.js'
import {registerDatasetsTools} from './datasets/register.js'
import {registerDocumentTools} from './documents/register.js'
import {registerEmbeddingsTools} from './embeddings/register.js'
import {registerGroqTools} from './groq/register.js'
import {registerProjectsTools} from './projects/register.js'
import {registerReleasesTools} from './releases/register.js'
import {registerSchemaTools} from './schema/register.js'
import type {McpRole} from '../types/mcp.js'

function createContextCheckingServer(server: McpServer): McpServer {
  const originalTool = server.tool
  return new Proxy(server, {
    get(target, prop) {
      if (prop === 'tool') {
        return function (this: any, ...args: any[]) {
          const [name, description, schema, handler] = args

          const wrappedHandler = async (args: any, extra: RequestHandlerExtra) => {
            enforceInitialContextMiddleware(name, args, extra)
            return handler(args, extra)
          }

          return originalTool.call(this, name, description, schema, wrappedHandler)
        }
      }
      return (target as any)[prop]
    },
  })
}

/**
 * Register all tools with for the MCP server
 */
function developerTools(server: McpServer) {
  const wrappedServer = createContextCheckingServer(server)

  registerContextTools(wrappedServer)
  registerConfigTools(wrappedServer)
  registerGroqTools(wrappedServer)
  registerDocumentTools(wrappedServer)
  registerProjectsTools(wrappedServer)
  registerSchemaTools(wrappedServer)
  registerDatasetsTools(wrappedServer)
  registerReleasesTools(wrappedServer)
  registerEmbeddingsTools(wrappedServer)
}

function editorTools(server: McpServer) {
  const wrappedServer = createContextCheckingServer(server)

  registerContextTools(wrappedServer)
  registerConfigTools(wrappedServer)
  registerGroqTools(wrappedServer)
  registerDocumentTools(wrappedServer)
  registerSchemaTools(wrappedServer)
  registerReleasesTools(wrappedServer)
  registerEmbeddingsTools(wrappedServer)
}

export function registerAllTools(server: McpServer, userRole: McpRole = 'developer') {
  const toolMap: Record<McpRole, (server: McpServer) => void> = {
    developer: developerTools,
    editor: editorTools,
  }
  const registerTools = toolMap[userRole]

  registerTools(server)
}
