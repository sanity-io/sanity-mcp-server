import {DocumentId, getPublishedId, getVersionId} from '@sanity/id-utils'

/**
 * Resolves the document ID for tool usage
 */
export function resolveDocumentId(documentId: string, releaseId?: string) {
  const publishedId = getPublishedId(DocumentId(documentId))
  if (releaseId) {
    return getVersionId(publishedId, releaseId)
  }
  return publishedId
}

/**
 * Resolves the schema ID for a given workspace.
 */
export function resolveSchemaId(workspaceName = 'default'): string {
  return `_.schemas.${workspaceName}`
}
