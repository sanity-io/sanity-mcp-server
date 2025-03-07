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
 * Applies patch operations to a Sanity patch object
 * 
 * @param patch - The patch operations to apply
 * @param patchObj - The Sanity patch object to modify
 */
export function applyPatchOperations(patch: Record<string, any>, patchObj: SanityPatch): void {
  if (patch.set) patchObj.set(patch.set);
  if (patch.setIfMissing) patchObj.setIfMissing(patch.setIfMissing);
  if (patch.unset) patchObj.unset(patch.unset);
  if (patch.inc) patchObj.inc(patch.inc);
  if (patch.dec) patchObj.dec(patch.dec);
  
  // Handle insert operations for arrays
  if (patch.insert) {
    const { items, position, at } = patch.insert;
    if (items && position && at) {
      patchObj.insert(position, at, items);
    }
  }
  
  // Handle diffMatchPatch operations for string patching
  if (patch.diffMatchPatch) {
    patchObj.diffMatchPatch(patch.diffMatchPatch);
  }
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
