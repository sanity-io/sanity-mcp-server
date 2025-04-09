import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {queryDocumentsTool, QueryDocumentsToolParams} from './queryDocumentsTool.js'
import {createDocumentTool, CreateDocumentToolParams} from './createDocumentTool.js'
import {documentActionsTool, DocumentActionsToolParams} from './documentActionsTool.js'
import {versionActionsTool, VersionActionsToolParams} from './versionActionsTool.js'

export function registerDocumentsTools(server: McpServer) {
  server.tool(
    'create_document',
    'Create a new document in Sanity with AI-generated content based on instructions',
    CreateDocumentToolParams.shape,
    createDocumentTool,
  )

  server.tool(
    'query_documents',
    'Query documents from Sanity using GROQ query language',
    QueryDocumentsToolParams.shape,
    queryDocumentsTool,
  )

  server.tool(
    'document_action',
    'Perform document actions like publishing, unpublishing, or deleting documents',
    DocumentActionsToolParams.shape,
    documentActionsTool,
  )

  server.tool(
    'version_action',
    'Manage document versions for content releases - create manual versions without AI, discard versions, replace, or mark for unpublishing',
    VersionActionsToolParams.shape,
    versionActionsTool,
  )
}
