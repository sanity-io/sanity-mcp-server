import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {listEmbeddingsIndicesTool, ListEmbeddingsIndicesToolParams} from './listEmbeddingsTool.js'
import {semanticSearchTool, SemanticSearchToolParams} from './semanticSearchTool.js'
import {_BaseToolSchemaType} from '../../utils/tools.js'

export function registerEmbeddingsTools(server: McpServer, baseSchema: _BaseToolSchemaType) {
  server.tool(
    'list_embeddings_indices',
    'List all available embeddings indices for a dataset',
    baseSchema.extend(ListEmbeddingsIndicesToolParams.shape).shape,
    listEmbeddingsIndicesTool,
  )
  server.tool(
    'semantic_search',
    'Perform a semantic search on an embeddings index',
    baseSchema.extend(SemanticSearchToolParams.shape).shape,
    semanticSearchTool,
  )
}
