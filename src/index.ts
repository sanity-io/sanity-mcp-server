import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {registerAllPrompts} from './prompts/register.js'
import {registerAllResources} from './resources/register.js'
import {registerAllTools} from './tools/register.js'
import {VERSION} from './config/version.js'
import {env} from './config/env.js'

const MCP_SERVER_NAME = '@sanity/mcp-server'

async function initializeServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: VERSION,
  })

  // Initialize Tools
  registerAllTools(server, env.data?.MCP_USER_ROLE)

  // Initialize Prompts
  registerAllPrompts(server)

  // Initialize Resources
  registerAllResources(server)

  return server
}

async function main() {
  try {
    const server = await initializeServer()
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('Sanity MCP Server running on stdio')
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
