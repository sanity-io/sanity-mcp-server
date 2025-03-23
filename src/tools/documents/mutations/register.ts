import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDocumentTool } from "./createDocument.js";
import { createMultipleDocumentsTool } from "./createMultipleDocuments.js";
import { deleteDocumentTool } from "./deleteDocument.js";
import { deleteMultipleDocumentsTool } from "./deleteMultipleDocuments.js";
import {
  createDocumentParams,
  createMultipleDocumentsParams,
  deleteDocumentParams,
  deleteMultipleDocumentsParams,
  updateDocumentParams,
} from "./schemas.js";
import { updateDocumentTool } from "./updateDocument.js";

/**
 * Register all document mutation tools with the MCP server
 */
export function registerDocumentMutationTools(server: McpServer) {
  server.tool(
    "create_document",
    "Create a new document in the Sanity dataset",
    createDocumentParams,
    createDocumentTool,
  );

  server.tool(
    "create_multiple_documents",
    "Create multiple documents in the Sanity dataset in a single transaction",
    createMultipleDocumentsParams,
    createMultipleDocumentsTool,
  );

  server.tool(
    "update_document",
    "Update an existing document in the Sanity dataset",
    updateDocumentParams,
    updateDocumentTool
  );

  server.tool(
    "delete_document",
    "Delete a document from the Sanity dataset",
    deleteDocumentParams,
    deleteDocumentTool
  );

  server.tool(
    "delete_multiple_documents",
    "Delete multiple documents from the Sanity dataset using IDs or a GROQ query",
    deleteMultipleDocumentsParams,
    deleteMultipleDocumentsTool
  );
}
