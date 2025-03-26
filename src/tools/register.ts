import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerConfigTools } from "./config/register.js";
import { registerGroqTools } from "./groq/register.js";
import { registerVersionTools } from "./version/register.js";
import { registerDocumentTools } from "./documents/register.js";
import { registerProjectsTools } from "./projects/register.js";
import { registerSchemaTools } from "./schema/register.js";

/**
 * Register all tools with for the MCP server
 */
export function registerAllTools(server: McpServer) {
  //registerExampleTools(server);
  registerConfigTools(server);
  registerGroqTools(server);
  registerVersionTools(server);
  registerDocumentTools(server);
  registerProjectsTools(server);
  registerSchemaTools(server);
}
