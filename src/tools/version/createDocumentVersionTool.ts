import { sanityClient } from "../../config/sanity.js";
import type { ContentObject, SanityDocument } from "../../types/sanity.js";
import type { CreateVersionResult } from "../../types/version.js";

/**
 * Creates a version document for a single document
 */
async function createSingleDocumentVersion(
  releaseId: string,
  documentId: string,
  content?: ContentObject
): Promise<SanityDocument> {
  const baseDocId = documentId.replace(/^drafts\./, '');

  // Get document content if not provided
  let documentContent = content;
  if (!documentContent) {
    const doc = await sanityClient.getDocument(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }
    documentContent = doc;
  }

  // Create version document
  const versionDoc = {
    _type: 'release.version',
    _id: `release.version.${releaseId}.${baseDocId}`,
    releaseId,
    documentId: baseDocId,
    content: documentContent
  };

  // Create the version
  return await sanityClient.create(versionDoc);
}

/**
 * Creates document versions in a specific release
 */
async function createDocumentVersionHandler(
  releaseId: string,
  documentId: string | string[],
  projectId?: string,
  dataset?: string,
  content?: ContentObject
): Promise<CreateVersionResult> {
  try {
    // Handle array of document IDs
    if (Array.isArray(documentId)) {
      if (documentId.length === 0) {
        throw new Error('Empty array of document IDs provided');
      }

      const versionIds: string[] = [];
      const results: SanityDocument[] = [];

      // Process each document ID
      for (const id of documentId) {
        const result = await createSingleDocumentVersion(releaseId, id, content);
        versionIds.push(result._id);
        results.push(result);
      }

      return {
        success: true,
        message: `Created ${versionIds.length} document versions for release ${releaseId}`,
        versionIds,
        result: {
          results: results.map(doc => ({ id: doc._id, operation: 'create' }))
        }
      };
    }

    // Handle single document ID
    const result = await createSingleDocumentVersion(releaseId, documentId, content);

    return {
      success: true,
      message: `Document version created for ${documentId.replace(/^drafts\./, '')} in release ${releaseId}`,
      versionId: result._id,
      result: {
        documentId: result._id,
        results: [{ id: result._id, operation: 'create' }]
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating document version:', error);
    throw new Error(`Failed to create document version: ${errorMessage}`);
  }
}

/**
 * Tool handler function for creating document versions
 */
export async function createDocumentVersionToolHandler(
  args: {
    releaseId: string;
    documentId: string | string[];
    projectId?: string;
    dataset?: string;
    content?: ContentObject;
  }
) {
  const result = await createDocumentVersionHandler(
    args.releaseId,
    args.documentId,
    args.projectId,
    args.dataset,
    args.content
  );
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(result, null, 2)
    }]
  };
} 