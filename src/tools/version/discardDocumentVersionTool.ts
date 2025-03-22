import { sanityClient } from "../../config/sanity.js";
import type { DiscardVersionResult } from "../../types/version.js";

/**
 * Sets up a transaction for discarding multiple document versions
 */
function setupDiscardVersionsTransaction(
  versionIds: string[],
  options?: { purge?: boolean }
): { transaction: any, visibility: 'sync' | 'async' } {
  const transaction = sanityClient.transaction();

  // Add delete operations for each version ID
  for (const id of versionIds) {
    transaction.delete(id);
  }

  // Determine visibility based on purge option
  const visibility = options?.purge ? 'async' : 'sync';

  return { transaction, visibility };
}

/**
 * Discards one or more specific versions of documents
 */
async function discardDocumentVersionHandler(
  versionId: string | string[],
  projectId?: string,
  dataset?: string,
  options?: {
    purge?: boolean;
  }
): Promise<DiscardVersionResult> {
  try {
    // Handle array of version IDs
    if (Array.isArray(versionId)) {
      if (versionId.length === 0) {
        throw new Error('Empty array of version IDs provided');
      }

      // Set up transaction for batch deletion
      const { transaction, visibility } = setupDiscardVersionsTransaction(versionId, options);

      // Commit the transaction
      const result = await transaction.commit({ visibility });

      return {
        success: true,
        message: `Discarded ${versionId.length} document versions`,
        versionIds: versionId,
        result: {
          results: versionId.map(id => ({ id, operation: 'delete' }))
        }
      };
    }

    // Handle single version ID
    await sanityClient.delete(versionId, {
      // If purge is true, completely remove from history
      visibility: options?.purge ? 'async' : 'sync'
    });

    return {
      success: true,
      message: `Document version ${versionId} discarded successfully`,
      versionId,
      result: {
        documentId: versionId,
        results: [{ id: versionId, operation: 'delete' }]
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error discarding document version:', error);
    throw new Error(`Failed to discard document version: ${errorMessage}`);
  }
}

/**
 * Tool handler function for discarding document versions
 */
export async function discardDocumentVersionToolHandler(
  args: {
    versionId: string | string[];
    projectId?: string;
    dataset?: string;
    purge?: boolean;
  }
) {
  const result = await discardDocumentVersionHandler(
    args.versionId,
    args.projectId,
    args.dataset,
    { purge: args.purge }
  );
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(result, null, 2)
    }]
  };
} 