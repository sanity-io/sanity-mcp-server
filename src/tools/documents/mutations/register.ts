import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDocumentTool } from "./createDocument.js";
import { createMultipleDocumentsTool } from "./createMultipleDocuments.js";
import { deleteDocumentTool } from "./deleteDocument.js";
import { deleteMultipleDocumentsTool } from "./deleteMultipleDocuments.js";
import { modifyDocumentTool } from "./modifyDocument.js";
import { modifyMultipleDocumentsTool } from "./modifyMultipleDocuments.js";
import { patchDocumentTool } from "./patchDocument.js";
import {
  createDocumentParams,
  createMultipleDocumentsParams,
  deleteDocumentParams,
  deleteMultipleDocumentsParams,
  modifyDocumentParams,
  modifyMultipleDocumentsParams,
  patchDocumentParams
} from "./schemas.js";

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
    "patch_document",
    "Patch an existing document in the Sanity dataset",
    patchDocumentParams,
    patchDocumentTool
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

  server.tool(
    "modify_document",
    "Apply a single mutation (create, patch, delete) to a document",
    modifyDocumentParams,
    modifyDocumentTool
  );

  server.tool(
    "modify_multiple_documents",
    "Apply multiple mutations (create, patch, delete) to documents in a single transaction",
    modifyMultipleDocumentsParams,
    modifyMultipleDocumentsTool
  );
}
