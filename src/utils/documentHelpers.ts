/**
 * Document helper utility functions for Sanity operations
 */
import { SanityClient, SanityPatch, SanityDocument, SanityError, PatchOperations, InsertOperation } from '../types/sanity.js';

/**
 * Normalizes document ID to ensure it has a 'drafts.' prefix
 * 
 * @param documentId - The document ID to normalize
 * @returns The normalized document ID with 'drafts.' prefix
 */
export function normalizeDraftId(documentId: string): string {
  return documentId.startsWith('drafts.') ? documentId : `drafts.${documentId}`;
}

/**
 * Normalizes a document ID by removing any 'drafts.' prefix
 * 
 * @param documentId - The document ID to normalize
 * @returns The normalized document ID without 'drafts.' prefix
 */
export function normalizeBaseDocId(documentId: string): string {
  return documentId.replace(/^drafts\./, '');
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
    console.error('Invalid patch object provided');
    return patchObj;
  }

  // Set fields if provided
  if (patch.set && typeof patchObj.set === 'function') {
    patchObj = patchObj.set(patch.set);
  }

  // Set fields if missing
  if (patch.setIfMissing && typeof patchObj.setIfMissing === 'function') {
    patchObj = patchObj.setIfMissing(patch.setIfMissing);
  }

  // Unset fields
  if (patch.unset && typeof patchObj.unset === 'function') {
    patchObj = patchObj.unset(patch.unset);
  }

  // Increment fields
  if (patch.inc && typeof patchObj.inc === 'function') {
    patchObj = patchObj.inc(patch.inc);
  }

  // Decrement fields
  if (patch.dec && typeof patchObj.dec === 'function') {
    patchObj = patchObj.dec(patch.dec);
  }

  // Insert operations
  if (patch.insert && typeof patchObj.insert === 'function') {
    const { position, items } = patch.insert;
    
    // Get the appropriate selector
    let selector = '';
    if (patch.insert.at) {
      // Legacy format
      selector = patch.insert.at;
    } else if (patch.insert.before) {
      selector = patch.insert.before;
    } else if (patch.insert.after) {
      selector = patch.insert.after;
    } else if (patch.insert.replace) {
      selector = patch.insert.replace;
    }

    if (selector && items && position) {
      patchObj = patchObj.insert(position, selector, items);
    }
  }

  // DiffMatchPatch operations
  if (patch.diffMatchPatch && typeof patchObj.diffMatchPatch === 'function') {
    patchObj = patchObj.diffMatchPatch(patch.diffMatchPatch);
  }

  // If revisionID is provided
  if (patch.ifRevisionID && typeof patchObj.ifRevisionId === 'function') {
    patchObj = patchObj.ifRevisionId(patch.ifRevisionID);
  }

  return patchObj;
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
  const baseDocId = normalizeBaseDocId(documentId);
  const draftId = `drafts.${baseDocId}`;
  
  try {
    // First try to get the draft version
    let documentContent = await client.getDocument(draftId);
    
    // If draft not found, try the published version
    if (!documentContent) {
      documentContent = await client.getDocument(baseDocId);
    }
    
    // If content was found, return it
    if (documentContent) {
      return documentContent;
    }
  } catch (e) {
    // Intentionally empty, will fall through to check fallback content
  }
  
  // If content parameter is provided, use that instead
  if (fallbackContent) {
    return fallbackContent;
  }
  
  throw new Error(`Document ${baseDocId} not found`);
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
    console.error(`${message}:`, error);
    return new Error(`${message}: ${error.message}`);
  } else {
    console.error(message);
    return new Error(message);
  }
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
  let parsedDocIds: string[];
  
  if (Array.isArray(documentIds)) {
    // Already an array - use as is
    parsedDocIds = documentIds;
  } else if (typeof documentIds === 'string') {
    // Check if this is a JSON string array
    if (documentIds.startsWith('[') && documentIds.endsWith(']')) {
      try {
        // Attempt to parse as JSON
        const parsed = JSON.parse(documentIds);
        if (Array.isArray(parsed)) {
          // Successfully parsed as array
          parsedDocIds = parsed;
        } else {
          // Parsed as something else (object, number, etc.) - treat as single ID
          parsedDocIds = [documentIds];
        }
      } catch (e) {
        // If parsing fails, treat as a single string
        parsedDocIds = [documentIds];
      }
    } else {
      // Regular string - treat as single ID
      parsedDocIds = [documentIds];
    }
  } else {
    // Unexpected type - convert to string and use as single ID
    parsedDocIds = [String(documentIds)];
  }
  
  if (parsedDocIds.length === 0) {
    throw new Error("No document IDs provided");
  }
  
  return parsedDocIds;
}
