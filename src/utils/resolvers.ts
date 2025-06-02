import {
  DocumentId,
  getPublishedId,
  getVersionId,
  getVersionNameFromId,
  isVersionId,
} from '@sanity/id-utils'

/**
 * Resolves the document ID for tool usage
 */
export function resolveDocumentId(documentId: string, releaseId?: string | false) {
  const normalizedDocumentId = DocumentId(documentId)
  const publishedId = getPublishedId(normalizedDocumentId)

  // If releaseId is explicitly false, return only published id
  if (releaseId === false) {
    return publishedId
  }

  // If documentId is a version ID, derive the version name from it
  let versionName = releaseId
  if (isVersionId(normalizedDocumentId)) {
    versionName = getVersionNameFromId(normalizedDocumentId)
  }

  if (versionName) {
    return getVersionId(publishedId, versionName)
  }

  return publishedId
}

/**
 * Resolves the schema ID for a given workspace.
 */
export function resolveSchemaId(workspaceName = 'default'): string {
  return `_.schemas.${workspaceName}`
}
