import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDocumentTool } from "./createDocument.js";
import { createDocumentParams } from "./schemas.js";

/**
 * Register all document mutation tools with the MCP server
 */
export function registerDocumentMutationTools(server: McpServer) {
  server.tool(
    "createDocument",
    "Create a new document in the Sanity dataset",
    createDocumentParams,
    createDocumentTool
  );
}
