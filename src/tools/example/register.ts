import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getExampleDocumentsTool } from "./getExampleDocumentsTool.js";
import { getExampleDocumentsParams } from "./schemas.js";

/**
 * Register all example tools with the MCP server
 */
export function registerExampleTools(server: McpServer) {
  server.tool(
    "get_example_documents",
    "Get example documents from Sanity",
    getExampleDocumentsParams,
    getExampleDocumentsTool
  );
}
