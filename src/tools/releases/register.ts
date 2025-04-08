import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {listAllReleases} from './listReleaseDocuments.js'
import {addDocumentToRelease} from './addDocumentToRelease.js'
import {
  ReleaseDocument,
  PublishMultipleDocuments,
  UnpublishDocument,
  UnpublishMultipleDocuments,
  Release,
  ListReleaseDocumentsParams,
  RemoveDocumentFromRelease,
  ReleaseMetadataUpdate,
} from './schemas.js'
import {unpublishDocumentFromRelease} from './unpublishDocumentFromRelease.js'
import {addMultipleDocumentsToRelease} from './addMultipleDocumentsToRelease.js'
import {unpublishMultipleDocumentsFromRelease} from './unpublishMultipleDocumentsFromRelease.js'
import {createRelease} from './createRelease.js'
import {removeDocumentFromRelease} from './discardDocumentFromRelease.js'
import {updateReleaseInformation} from './updateReleaseInformation.js'

export function registerReleasesTools(server: McpServer) {
  server.tool('create_release', 'Create a new release', Release, createRelease)
  server.tool(
    'update_release_information',
    'update the metadata for a given release',
    ReleaseMetadataUpdate,
    updateReleaseInformation,
  )

  server.tool(
    'add_document_to_release',
    'Add a docuement to a release',
    ReleaseDocument,
    addDocumentToRelease,
  )

  server.tool(
    'add_multiple_documents_to_release',
    'Add multiple docuements to a release',
    PublishMultipleDocuments,
    addMultipleDocumentsToRelease,
  )

  server.tool(
    'remove_document_from_release',
    'removes a document from a given release',
    RemoveDocumentFromRelease,
    removeDocumentFromRelease,
  )

  server.tool(
    'unpublish_multiple_documents_from_release',
    'unpublish multiple documents from a release',
    UnpublishMultipleDocuments,
    unpublishMultipleDocumentsFromRelease,
  )

  server.tool(
    'unpublish_document_from_release',
    'unpublish a document from a release',
    UnpublishDocument,
    unpublishDocumentFromRelease,
  )

  server.tool(
    'list_release_documents',
    'List all releases documents',
    ListReleaseDocumentsParams,
    listAllReleases,
  )
}
