import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {listEmbeddingsIndicesTool, ListEmbeddingsIndicesToolParams} from './listEmbeddingsTool.js'
import {semanticSearchTool, SemanticSearchToolParams} from './semanticSearchTool.js'

export function registerEmbeddingsTools(server: McpServer) {
  server.tool(
    'list_embeddings_indices',
    'List all available embeddings indices for a dataset',
    ListEmbeddingsIndicesToolParams.shape,
    listEmbeddingsIndicesTool,
  )
  server.tool(
    'semantic_search',
    'Perform a semantic search on an embeddings index',
    SemanticSearchToolParams.shape,
    semanticSearchTool,
  )
}
