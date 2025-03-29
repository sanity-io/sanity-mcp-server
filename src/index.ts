import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllPrompts } from "./prompts/register.js";
import { registerAllResources } from "./resources/register.js";
import { registerAllTools } from "./tools/register.js";


async function initializeServer() {

  const server = new McpServer({
      name: "sanity",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {
          listChanged: false
        }
      }
    }
  );

  // Initialize Tools
  registerAllTools(server);

  // Initialize Prompts
  registerAllPrompts(server);

  // Initialize Resources
  registerAllResources(server);

  return server;
}

async function main() {
  try {
    const server = await initializeServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Sanity MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();