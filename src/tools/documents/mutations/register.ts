import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDocumentTool } from "./createDocument.js";
import { createDocumentParams, updateDocumentParams } from "./schemas.js";
import { updateDocumentTool } from "./updateDocument.js";

/**
 * Register all document mutation tools with the MCP server
 */
export function registerDocumentMutationTools(server: McpServer) {
  server.tool(
    "create_document",
    "Create a new document in the Sanity dataset",
    createDocumentParams,
    createDocumentTool
  );

  server.tool(
    "update_document",
    "Update an existing document in the Sanity dataset",
    updateDocumentParams,
    updateDocumentTool
  );
}
