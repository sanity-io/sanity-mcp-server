#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {registerAllPrompts} from './prompts/register.js'
import {registerAllResources} from './resources/register.js'
import {registerAllTools} from './tools/register.js'
import {VERSION} from './config/version.js'
import {MCP_INSTRUCTIONS} from './instructions.js'
import { env } from './config/env.js'

const MCP_SERVER_NAME = '@sanity/mcp-server'

export type ServerOptions = {
  token?: string,
  projectId?: string,
  dataset?: string,
}

async function initializeServer(serverOptions?: ServerOptions) {
  const server = new McpServer(
    {
      name: MCP_SERVER_NAME,
      version: VERSION,
    },
    {
      instructions: MCP_INSTRUCTIONS,
    }
  )

  registerAllTools(server, serverOptions || {})
  registerAllPrompts(server)
  registerAllResources(server)

  return server
}

async function main() {
  try {
    const server = await initializeServer({
      projectId: env.data?.SANITY_PROJECT_ID,
      dataset: env.data?.SANITY_DATASET,
      token: env.data?.SANITY_API_TOKEN,
    })
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
