import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDocumentMutationTools } from "./mutations/register.js";
import { registerDocumentRetrivalTools } from "./retrieval/register.js";
import { registerDocumentActionTools } from "./actions/register.js";

/**
 * Register all document tools with the MCP server
 */
export function registerDocumentTools(server: McpServer) {
  registerDocumentRetrivalTools(server);
  registerDocumentMutationTools(server);
  registerDocumentActionTools(server);
}
