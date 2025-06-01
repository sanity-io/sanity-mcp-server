import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {queryDocumentsTool, QueryDocumentsToolParams} from './queryDocumentsTool.js'
import {createDocumentTool, CreateDocumentToolParams} from './createDocumentTool.js'
import {updateDocumentTool, UpdateDocumentToolParams} from './updateDocumentTool.js'
import {patchDocumentTool, PatchDocumentToolParams} from './patchDocumentTool.js'
import {transformDocumentTool, TransformDocumentToolParams} from './transformDocumentTool.js'
import {transformImageTool, TransformImageToolParams} from './transformImageTool.js'
import {translateDocumentTool, TranslateDocumentToolParams} from './translateDocumentTool.js'
import {documentActionsTool, DocumentActionsToolParams} from './documentActionsTool.js'
import {createVersionTool, CreateVersionToolParams} from './createVersionTool.js'

export function registerDocumentsTools(server: McpServer) {
  server.tool(
    'create_document',
    "Create a completely new document from scratch with AI-generated content. Use when you need to create new content that doesn't exist yet.",
    CreateDocumentToolParams.shape,
    createDocumentTool,
  )

  server.tool(
    'create_version',
    'Create a version of an existing document for a specific release, with optional AI-generated modifications',
    CreateVersionToolParams.shape,
    createVersionTool,
  )

  server.tool(
    'transform_image',
    'Transform or generate images in documents using AI. Automatically targets the image asset for transformation or generation. Use "transform" for modifying existing images or "generate" for creating new images.',
    TransformImageToolParams.shape,
    transformImageTool,
  )

  server.tool(
    'update_document',
    'Update existing document content using AI to rewrite, expand, or modify based on natural language instructions. Best for general content updates, rewrites, and improvements where you want AI to interpret and generate new content.',
    UpdateDocumentToolParams.shape,
    updateDocumentTool,
  )

  server.tool(
    'patch_document',
    'Apply precise, direct modifications to document fields without AI generation. Use for exact value changes, adding/removing specific items, or when you know exactly what needs to be changed. No content interpretation or generation. Performs one operation at a time.',
    PatchDocumentToolParams.shape,
    patchDocumentTool,
  )

  server.tool(
    'transform_document',
    'Transform existing content while preserving rich text formatting, annotations, and structure. Use for find-and-replace operations, style corrections, or content modifications where maintaining original formatting is crucial. Choose over "update_document" when formatting preservation is important.',
    TransformDocumentToolParams.shape,
    transformDocumentTool,
  )

  server.tool(
    'translate_document',
    'Translate document content to a different language while preserving formatting and structure. Specifically designed for language translation with support for protected phrases and style guides. Always use this instead of other tools for translation tasks.',
    TranslateDocumentToolParams.shape,
    translateDocumentTool,
  )

  server.tool(
    'query_documents',
    'Query documents from Sanity using GROQ query language',
    QueryDocumentsToolParams.shape,
    queryDocumentsTool,
  )

  server.tool(
    'document_action',
    'Perform document actions like publishing, unpublishing, deleting, or discarding documents',
    DocumentActionsToolParams.shape,
    documentActionsTool,
  )
}
