import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerConfigTools } from "./config/register.js";
import { registerExampleTools } from "./example/register.js";
import { registerGroqTools } from "./groq/register.js";

/**
 * Register all tools with the MCP server
 */
export function registerAllTools(server: McpServer) {
  registerConfigTools(server);
  registerExampleTools(server);
  registerGroqTools(server);
} 