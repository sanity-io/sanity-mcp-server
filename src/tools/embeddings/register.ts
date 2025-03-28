import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listEmbeddingsIndicesTool } from "./listEmbeddingsTool.js";
import { semanticSearchTool } from "./semanticSearchTool.js";
import { SemanticSearchParams } from "./schema.js";

export function registerEmbeddingsTools(server: McpServer) {
  server.tool(
    "list_embeddings_indices",
    "List all available embeddings indices for a dataset",
    {},
    listEmbeddingsIndicesTool
  );
  server.tool(
    "semantic_search",
    "Perform a semantic search on an embeddings index",
    SemanticSearchParams,
    semanticSearchTool
  );
}
