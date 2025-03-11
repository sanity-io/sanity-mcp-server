/**
 * Document helper utility functions for Sanity operations
 */
import type {InsertOperation, PatchOperations, SanityClient, SanityDocument, SanityError, SanityPatch} from '../types/sanity.js'

/**
 * Normalizes document ID to ensure it has a 'drafts.' prefix
 *
 * @param documentId - The document ID to normalize
 * @returns The normalized document ID with 'drafts.' prefix
 */
export function normalizeDraftId(documentId: string): string {
  return documentId.startsWith('drafts.') ? documentId : `drafts.${documentId}`
}

/**
 * Normalizes a document ID by removing any 'drafts.' prefix
 *
 * @param documentId - The document ID to normalize
 * @returns The normalized document ID without 'drafts.' prefix
 */
export function normalizeBaseDocId(documentId: string): string {
  return documentId.replace(/^drafts\./, '')
}

/**
 * Apply set and setIfMissing operations
 *
 * @param patch - Patch operations to apply
 * @param patchObj - Sanity patch object
 * @returns Updated patch object
 */
function applySetOperations(patch: PatchOperations, patchObj: any): any {
  let updatedPatch = patchObj

  // Set fields if provided
  if (patch.set && typeof updatedPatch.set === 'function') {
    updatedPatch = updatedPatch.set(patch.set)
  }

  // Set fields if missing
  if (patch.setIfMissing && typeof updatedPatch.setIfMissing === 'function') {
    updatedPatch = updatedPatch.setIfMissing(patch.setIfMissing)
  }

  return updatedPatch
}

/**
 * Apply unset, increment, and decrement operations
 *
 * @param patch - Patch operations to apply
 * @param patchObj - Sanity patch object
 * @returns Updated patch object
 */
function applyModificationOperations(patch: PatchOperations, patchObj: any): any {
  let updatedPatch = patchObj

  // Unset fields
  if (patch.unset && typeof updatedPatch.unset === 'function') {
    updatedPatch = updatedPatch.unset(patch.unset)
  }

  // Increment fields
  if (patch.inc && typeof updatedPatch.inc === 'function') {
    updatedPatch = updatedPatch.inc(patch.inc)
  }

  // Decrement fields
  if (patch.dec && typeof updatedPatch.dec === 'function') {
    updatedPatch = updatedPatch.dec(patch.dec)
  }

  return updatedPatch
}

/**
 * Processes basic patch operations (set, setIfMissing, unset, inc, dec)
 *
 * @param patch - Patch operations to apply
 * @param patchObj - Sanity patch object
 * @returns Updated patch object
 */
function processBasicOperations(patch: PatchOperations, patchObj: any): any {
  let updatedPatch = patchObj

  // Apply operations in sequence
  updatedPatch = applySetOperations(patch, updatedPatch)
  updatedPatch = applyModificationOperations(patch, updatedPatch)

  return updatedPatch
}

/**
 * Determines the selector to use for insert operations
 *
 * @param insert - Insert operation configuration
 * @returns The appropriate selector or empty string if none found
 */
function determineInsertSelector(insert: any): string {
  if (insert.at) {
    // Legacy format
    return insert.at
  }

  if (insert.before) {
    return insert.before
  }

  if (insert.after) {
    return insert.after
  }

  if (insert.replace) {
    return insert.replace
  }

  return ''
}

/**
 * Process insert operations on arrays
 *
 * @param patch - Patch operations containing insert operation
 * @param patchObj - Sanity patch object
 * @returns Updated patch object
 */
function processInsertOperation(patch: PatchOperations, patchObj: any): any {
  if (!patch.insert || typeof patchObj.insert !== 'function') {
    return patchObj
  }

  const {position, items} = patch.insert
  const selector = determineInsertSelector(patch.insert)

  if (!selector || !items || !position) {
    return patchObj
  }

  return patchObj.insert(position, selector, items)
}

/**
 * Process special operations (diffMatchPatch, ifRevisionID)
 *
 * @param patch - Patch operations containing special operations
 * @param patchObj - Sanity patch object
 * @returns Updated patch object
 */
function processSpecialOperations(patch: PatchOperations, patchObj: any): any {
  let updatedPatch = patchObj

  // DiffMatchPatch operations
  if (patch.diffMatchPatch && typeof updatedPatch.diffMatchPatch === 'function') {
    updatedPatch = updatedPatch.diffMatchPatch(patch.diffMatchPatch)
  }

  // If revisionID is provided
  if (patch.ifRevisionID && typeof updatedPatch.ifRevisionId === 'function') {
    updatedPatch = updatedPatch.ifRevisionId(patch.ifRevisionID)
  }

  return updatedPatch
}

/**
 * Apply patch operations to a patch object
 *
 * @param patch - Patch operations to apply
 * @param patchObj - Patch object to apply them to
 * @returns The updated patch object
 */
export function applyPatchOperations(patch: PatchOperations, patchObj: any): any {
  // Check if patchObj is valid
  if (!patchObj) {
    console.error('Invalid patch object provided')
    return patchObj
  }

  // Process operations in sequence
  let updatedPatch = patchObj
  updatedPatch = processBasicOperations(patch, updatedPatch)
  updatedPatch = processInsertOperation(patch, updatedPatch)
  updatedPatch = processSpecialOperations(patch, updatedPatch)

  return updatedPatch
}

/**
 * Retrieves document content, trying draft first then published version
 *
 * @param client - Sanity client
 * @param documentId - The document ID to retrieve
 * @param fallbackContent - Optional fallback content
 * @returns The document content or fallback content
 * @throws Error if document not found and no fallback content provided
 */
export async function getDocumentContent(
  client: SanityClient,
  documentId: string,
  fallbackContent?: SanityDocument
): Promise<SanityDocument> {
  const baseDocId = normalizeBaseDocId(documentId)
  const draftId = `drafts.${baseDocId}`

  try {
    // First try to get the draft version
    let documentContent = await client.getDocument(draftId)

    // If draft not found, try the published version
    if (!documentContent) {
      documentContent = await client.getDocument(baseDocId)
    }

    // If content was found, return it
    if (documentContent) {
      return documentContent
    }
  } catch (e) {
    // Intentionally empty, will fall through to check fallback content
  }

  // If content parameter is provided, use that instead
  if (fallbackContent) {
    return fallbackContent
  }

  throw new Error(`Document ${baseDocId} not found`)
}

/**
 * Creates a standardized error response for controller functions
 *
 * @param message - The error message
 * @param error - The original error object (optional)
 * @returns Standardized error message
 */
export function createErrorResponse(message: string, error?: Error | SanityError): Error {
  if (error) {
    console.error(`${message}:`, error)
    return new Error(`${message}: ${error.message}`)
  }

  console.error(message)
  return new Error(message)
}

/**
 * Attempts to parse a string as a JSON array
 *
 * @param input - String to parse
 * @returns Parsed array if successful, or null if parsing fails
 */
function tryParseJsonArray(input: string): string[] | null {
  if (input.startsWith('[') && input.endsWith(']')) {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (e) {
      // Parsing failed, return null
    }
  }
  return null
}

/**
 * Handles the case when documentIds is a string
 *
 * @param documentIds - Document ID string to normalize
 * @returns Normalized array of document IDs
 */
function normalizeStringDocId(documentIds: string): string[] {
  // Check if this is a JSON string array
  const parsedArray = tryParseJsonArray(documentIds)
  if (parsedArray) {
    return parsedArray
  }

  // Regular string - treat as single ID
  return [documentIds]
}

/**
 * Normalizes document IDs from various input formats
 * Handles single IDs, arrays, and JSON string representations
 *
 * @param documentIds - Document IDs in various possible formats
 * @returns Normalized array of document IDs
 * @throws Error if no valid document IDs are provided
 */
export function normalizeDocumentIds(documentIds: string | string[]): string[] {
  let parsedDocIds: string[]

  if (Array.isArray(documentIds)) {
    // Already an array - use as is
    parsedDocIds = documentIds
  } else if (typeof documentIds === 'string') {
    parsedDocIds = normalizeStringDocId(documentIds)
  } else {
    // Unexpected type - convert to string and use as single ID
    parsedDocIds = [String(documentIds)]
  }

  if (parsedDocIds.length === 0) {
    throw new Error('No document IDs provided')
  }

  return parsedDocIds
}
