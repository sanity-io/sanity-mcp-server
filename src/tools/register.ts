import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'
import {enforceInitialContextMiddleware} from './context/middleware.js'
import {registerContextTools} from './context/register.js'
import {registerDatasetsTools} from './datasets/register.js'
import {registerDocumentsTools} from './documents/register.js'
import {registerEmbeddingsTools} from './embeddings/register.js'
import {registerGroqTools} from './groq/register.js'
import {registerProjectsTools} from './projects/register.js'
import {registerReleasesTools} from './releases/register.js'
import {registerSchemaTools} from './schema/register.js'
import type {McpRole} from '../types/mcp.js'
import type {THIS_IS_FINE} from '../types/any.js'
import type {ServerNotification, ServerRequest} from '@modelcontextprotocol/sdk/types.js'

function createContextCheckingServer(server: McpServer): McpServer {
  const originalTool = server.tool
  return new Proxy(server, {
    get(target, prop) {
      if (prop === 'tool') {
        return function (this: THIS_IS_FINE, ...args: THIS_IS_FINE) {
          const [name, description, schema, annotations, handler] = args

          const wrappedHandler = async (
            args: THIS_IS_FINE,
            extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
          ) => {
            enforceInitialContextMiddleware(name)
            return handler(args, extra)
          }

          return originalTool.call(this, name, description, schema, annotations, wrappedHandler)
        }
      }
      return (target as THIS_IS_FINE)[prop]
    },
  })
}

/**
 * Register all tools with for the MCP server
 */
function developerTools(server: McpServer) {
  const wrappedServer = createContextCheckingServer(server)

  registerContextTools(wrappedServer)
  registerGroqTools(wrappedServer)
  registerDocumentsTools(wrappedServer)
  registerProjectsTools(wrappedServer)
  registerSchemaTools(wrappedServer)
  registerDatasetsTools(wrappedServer)
  registerReleasesTools(wrappedServer)
  registerEmbeddingsTools(wrappedServer)
}

function editorTools(server: McpServer) {
  const wrappedServer = createContextCheckingServer(server)

  registerContextTools(wrappedServer)
  registerGroqTools(wrappedServer)
  registerDocumentsTools(wrappedServer)
  registerSchemaTools(wrappedServer)
  registerReleasesTools(wrappedServer)
  registerEmbeddingsTools(wrappedServer)
}

function agentTools(server: McpServer) {
  registerGroqTools(server)
  registerDocumentsTools(server)
  registerSchemaTools(server)
  registerReleasesTools(server)
  registerEmbeddingsTools(server)
  registerProjectsTools(server)
}

export function registerAllTools(server: McpServer, userRole: McpRole = 'developer') {
  const toolMap: Record<McpRole, (server: McpServer) => void> = {
    developer: developerTools,
    editor: editorTools,
    internal_agent_role: agentTools,
  }
  const registerTools = toolMap[userRole]

  registerTools(server)
}
