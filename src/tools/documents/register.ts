import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {queryDocumentsTool, QueryDocumentsToolParams} from './queryDocumentsTool.js'
import {createDocumentTool, CreateDocumentToolParams} from './createDocumentTool.js'
import {updateDocumentTool, UpdateDocumentToolParams} from './updateDocumentTool.js'
import {patchDocumentTool, PatchDocumentToolParams} from './patchDocumentTool.js'
import {documentActionsTool, DocumentActionsToolParams} from './documentActionsTool.js'
import {createVersionTool, CreateVersionToolParams} from './createVersionTool.js'
import {discardVersionTool, DiscardVersionToolParams} from './discardVersionTool.js'
import {
  markVersionForUnpublishTool,
  MarkVersionForUnpublishParams,
} from './markVersionForUnpublishTool.js'

export function registerDocumentsTools(server: McpServer) {
  // Document tools
  server.tool(
    'create_document',
    'Create a new document in Sanity with AI-generated content based on instructions',
    CreateDocumentToolParams.shape,
    createDocumentTool,
  )

  server.tool(
    'update_document',
    'Update an existing document or version with AI-generated content based on instructions',
    UpdateDocumentToolParams.shape,
    updateDocumentTool,
  )

  server.tool(
    'patch_document',
    'Apply direct patch operations to modify specific parts of a document without using AI generation',
    PatchDocumentToolParams.shape,
    patchDocumentTool,
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

  // Versioning tools
  server.tool(
    'create_version',
    'Create a version of an existing document for a specific release, with optional AI-generated modifications',
    CreateVersionToolParams.shape,
    createVersionTool,
  )

  server.tool(
    'discard_version',
    'Delete a specific version document from a release',
    DiscardVersionToolParams.shape,
    discardVersionTool,
  )

  server.tool(
    'mark_for_unpublish',
    'Mark a document to be unpublished when a specific release is published',
    MarkVersionForUnpublishParams.shape,
    markVersionForUnpublishTool,
  )
}
