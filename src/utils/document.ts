import type {SanityClient} from '@sanity/client'
import {type DocumentId, getDraftId, getPublishedId, isVersionId, isDraftId} from '@sanity/id-utils'

/**
 * Retrieves a document from Sanity by document ID.
 *
 * If the document ID is a version ID, returns that specific version.
 * Otherwise, fetches both draft and published versions and returns the appropriate one
 * based on the original document ID type - prioritizing draft for draft IDs and
 * published for published IDs.
 */
export async function getDocument(documentId: DocumentId, client: SanityClient) {
  if (isVersionId(documentId)) {
    const document = await client.getDocument(documentId)
    if (!document) {
      throw new Error(`Could not find document: "${documentId}"`)
    }
    return document
  }

  const [draft, published] = await Promise.all([
    client.getDocument(getDraftId(documentId)),
    client.getDocument(getPublishedId(documentId)),
  ])

  if (!draft && !published) {
    throw new Error(`Could not find document: "${documentId}"`)
  }

  // Prioritize draft over published depending on the original document ID
  if (isDraftId(documentId)) {
    return (draft || published)!
  }
  return (published || draft)!
}
