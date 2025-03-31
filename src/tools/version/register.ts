import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDocumentVersionToolHandler } from "./createDocumentVersionTool.js";
import { discardDocumentVersionToolHandler } from "./discardDocumentVersionTool.js";
import { createDocumentVersionSchema, discardDocumentVersionSchema } from "./schemas.js";

export function registerVersionTools(server: McpServer) {
  // Register create document version tool
  server.tool(
    "create_document_version",
    "Creates a version of a document in a specific release. This allows tracking document changes and managing content releases.",
    createDocumentVersionSchema,
    createDocumentVersionToolHandler
  );

  // Register discard document version tool
  server.tool(
    "discard_document_version",
    "Discards a specific version of a document. This removes the version from the release history, with an option to permanently purge it.",
    discardDocumentVersionSchema,
    discardDocumentVersionToolHandler
  );
} 