import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {queryDocumentsTool, QueryDocumentsToolParams} from './queryDocumentsTool.js'
import {createDocumentTool, CreateDocumentToolParams} from './createDocumentTool.js'
import {updateDocumentTool, UpdateDocumentToolParams} from './updateDocumentTool.js'
import {patchDocumentTool, PatchDocumentToolParams} from './patchDocumentTool.js'
import {transformDocumentTool, TransformDocumentToolParams} from './transformDocumentTool.js'
import {transformImageTool, TransformImageToolParams} from './transformImageTool.js'
import {translateDocumentTool, TranslateDocumentToolParams} from './translateDocumentTool.js'
import {createVersionTool, CreateVersionToolParams} from './createVersionTool.js'
import {deleteDocumentTool, DeleteDocumentToolParams} from './deleteDocumentTool.js'
import {publishDocumentTool, PublishDocumentToolParams} from './publishDocumentTool.js'
import {unpublishDocumentTool, UnpublishDocumentToolParams} from './unpublishDocumentTool.js'
import {
  versionReplaceDocumentTool,
  VersionReplaceDocumentToolParams,
} from './versionReplaceDocumentTool.js'
import {
  versionDiscardDocumentTool,
  VersionDiscardDocumentToolParams,
} from './versionDiscardDocumentTool.js'
import {
  versionUnpublishDocumentTool,
  VersionUnpublishDocumentToolParams,
} from './versionUnpublishDocumentTool.js'
import {_BaseToolSchemaType} from '../../utils/tools.js'

export function registerDocumentsTools(server: McpServer, baseSchema: _BaseToolSchemaType) {
  server.tool(
    'create_document',
    "Create a completely new document from scratch with AI-generated content. Use when you need to create new content that doesn't exist yet.",
    baseSchema.extend(CreateDocumentToolParams.shape).shape,
    createDocumentTool,
  )

  server.tool(
    'create_version',
    'Create a version of an existing document for a specific release, with optional AI-generated modifications',
    baseSchema.extend(CreateVersionToolParams.shape).shape,
    createVersionTool,
  )

  server.tool(
    'transform_image',
    'Transform or generate images in documents using AI. Automatically targets the image asset for transformation or generation. Use "transform" for modifying existing images or "generate" for creating new images.',
    baseSchema.extend(TransformImageToolParams.shape).shape,
    transformImageTool,
  )

  server.tool(
    'patch_document',
    'Apply precise, direct modifications to document fields without AI generation. Use for exact value changes, adding/removing specific items, or when you know exactly what needs to be changed. No content interpretation or generation. Performs one operation at a time.',
    baseSchema.extend(PatchDocumentToolParams.shape).shape,
    patchDocumentTool,
  )

  server.tool(
    'update_document',
    'Update existing document content using AI to rewrite, expand, or modify based on natural language instructions. Best for general content updates, rewrites, and improvements where you want AI to interpret and generate new content.',
    baseSchema.extend(UpdateDocumentToolParams.shape).shape,
    updateDocumentTool,
  )

  server.tool(
    'transform_document',
    'Transform existing content while preserving rich text formatting, annotations, and structure. Use for find-and-replace operations, style corrections, or content modifications where maintaining original formatting is crucial. Choose over "update_document" when formatting preservation is important.',
    baseSchema.extend(TransformDocumentToolParams.shape).shape,
    transformDocumentTool,
  )

  server.tool(
    'translate_document',
    'Translate document content to a different language while preserving formatting and structure. Specifically designed for language translation with support for protected phrases and style guides. Always use this instead of other tools for translation tasks.',
    baseSchema.extend(TranslateDocumentToolParams.shape).shape,
    translateDocumentTool,
  )

  server.tool(
    'query_documents',
    'Query documents from Sanity using GROQ query language',
    baseSchema.extend(QueryDocumentsToolParams.shape).shape,
    queryDocumentsTool,
  )

  server.tool(
    'publish_document',
    'Publish a draft document to make it live',
    baseSchema.extend(PublishDocumentToolParams.shape).shape,
    publishDocumentTool,
  )

  server.tool(
    'unpublish_document',
    'Unpublish a published document (moves it back to drafts)',
    baseSchema.extend(UnpublishDocumentToolParams.shape).shape,
    unpublishDocumentTool,
  )

  server.tool(
    'version_replace_document',
    'Replace the contents of a document version with contents from another document',
    baseSchema.extend(VersionReplaceDocumentToolParams.shape).shape,
    versionReplaceDocumentTool,
  )

  server.tool(
    'version_discard_document',
    'Discard a document version from a release (removes it from the release)',
    baseSchema.extend(VersionDiscardDocumentToolParams.shape).shape,
    versionDiscardDocumentTool,
  )

  server.tool(
    'version_unpublish_document',
    'Mark a document to be unpublished when the release is run',
    baseSchema.extend(VersionUnpublishDocumentToolParams.shape).shape,
    versionUnpublishDocumentTool,
  )

  server.tool(
    'delete_document',
    'Permanently delete a document and all its drafts',
    baseSchema.extend(DeleteDocumentToolParams.shape).shape,
    deleteDocumentTool,
  )
}
