#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import minimist from 'minimist'
import {registerAllPrompts} from './prompts/register.js'
import {registerAllResources} from './resources/register.js'
import {registerAllTools} from './tools/register.js'
import {VERSION} from './config/version.js'
import type {McpRole} from './types/mcp.js'

const MCP_SERVER_NAME = '@sanity/mcp'

const argv = minimist(process.argv.slice(2), {
  string: ['dataset', 'project-id', 'token', 'api-host', 'role'],
  default: {
    'api-host': 'https://api.sanity.io',
    'role': 'developer',
  },
  alias: {
    d: 'dataset',
    p: 'project-id',
    t: 'token',
    h: 'api-host',
    r: 'role',
  },
})

if (argv.dataset) process.env.SANITY_DATASET = argv.dataset
if (argv['project-id']) process.env.SANITY_PROJECT_ID = argv['project-id']
if (argv.token) process.env.SANITY_API_TOKEN = argv.token
if (argv['api-host']) process.env.SANITY_API_HOST = argv['api-host']
if (argv.role) process.env.MCP_USER_ROLE = argv.role

async function initializeServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: VERSION,
  })

  registerAllTools(server, process.env.MCP_USER_ROLE as McpRole)
  registerAllPrompts(server)
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
