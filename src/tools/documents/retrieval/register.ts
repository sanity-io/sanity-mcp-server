import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDocumentById } from "./getDocumentById.js";
import { getDocumentsByIds } from "./getDocumentsByIds.js";
import { GetDocumentParams, GetDocumentsParams } from "./schema.js";

export async function registerDocumentRetrivalTools(server: McpServer) {
  server.tool(
    "get_document_by_id",
    "Get a sanity document based on the document ID",
    GetDocumentParams,
    getDocumentById,
  );

  server.tool(
    "get_documents_by_ids",
    "Get multiple sanity document based on the document IDs",
    GetDocumentsParams,
    getDocumentsByIds,
  );
}
