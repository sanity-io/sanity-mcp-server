import {
  DocumentId,
  getPublishedId,
  getVersionId,
  getVersionNameFromId,
  isVersionId,
} from '@sanity/id-utils'

/**
 * Resolves the document ID for tool usage, handling both published and versioned documents.
 *
 * @param documentId - The document ID to resolve (can be published or versioned)
 * @param releaseId - Optional release/version identifier:
 *   - `string`: Use this specific version name
 *   - `false`: Explicitly request only the published version (bypasses version detection)
 *   - `undefined`: Allow version detection from documentId if it's a version ID
 *
 * The `false` option is useful when you want to ensure you're working with the published
 * version only, even if the documentId contains version information that would normally
 * be used to derive a versioned ID.
 *
 * @returns The resolved document ID (published or versioned based on parameters)
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

/**
 * Resolves an AI action instruction
 */
export function resolveAiActionInstruction(instruction: string): string {
  return instruction.replace(/\$/g, '\\$')
}
