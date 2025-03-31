import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { updateDocumentWithAiParams } from "./schemas.js";
import { updateDocumentWithAi } from "./updateDocumentWithAI.js";


/**
 * Register all instruct-related tools with the MCP server
 */
export function registerInstructTools(server: McpServer) {
  server.tool(
    'update_document_with_ai',
    `Use this tool to update a document with instructions to another AI tool.`,
    updateDocumentWithAiParams,
    updateDocumentWithAi
  );
}
