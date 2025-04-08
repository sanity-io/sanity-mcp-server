import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {PublishDocument, PublishDocuments} from './schema.js'
import {publishDocument} from './publishDocument.js'
import {publishMultipleDocuments} from './publishMultipleDocuments.js'
import {unpublishMultipleDocuments} from './unpublishMultipleDocuments.js'
import {unpublishDocument} from './unpublishDocument.js'

export async function registerDocumentActionTools(server: McpServer) {
  server.tool('publish_document', 'Publish a draft document', PublishDocument, publishDocument)

  server.tool(
    'publish_multiple_document',
    'Publish multiple draft documents',
    PublishDocuments,
    publishMultipleDocuments,
  )

  server.tool(
    'unpublish_document',
    'Unpublish a draft document',
    PublishDocument,
    unpublishDocument,
  )

  server.tool(
    'unpublish_multiple_document',
    'Unpublish multiple documents',
    PublishDocuments,
    unpublishMultipleDocuments,
  )
}
