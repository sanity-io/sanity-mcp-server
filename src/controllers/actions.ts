import { createSanityClient, sanityApi } from '../utils/sanityClient.js';

/**
 * Publishes a document (makes draft the published version)
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - The document ID to publish
 * @returns Result of the publish operation
 */
export async function publishDocument(
  projectId: string, 
  dataset: string, 
  documentId: string
): Promise<{
  success: boolean;
  message: string;
  documentId: string;
  result: any;
}> {
  try {
    // Ensure document ID doesn't already have 'drafts.' prefix
    const baseDocId = documentId.replace(/^drafts\./, '');
    const draftId = `drafts.${baseDocId}`;
    
    // Create the publish action
    const action = {
      actionType: 'sanity.action.document.publish',
      draftId,
      publishedId: baseDocId
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Document ${baseDocId} published successfully`,
      documentId: baseDocId,
      result
    };
  } catch (error: any) {
    console.error(`Error publishing document ${documentId}:`, error);
    throw new Error(`Failed to publish document: ${error.message}`);
  }
}

/**
 * Unpublishes a document (keeps it as draft only)
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - The document ID to unpublish
 * @returns Result of the unpublish operation
 */
export async function unpublishDocument(
  projectId: string, 
  dataset: string, 
  documentId: string
): Promise<{
  success: boolean;
  message: string;
  draftId: string;
  result: any;
}> {
  try {
    // Ensure document ID doesn't already have 'drafts.' prefix
    const baseDocId = documentId.replace(/^drafts\./, '');
    const draftId = `drafts.${baseDocId}`;
    
    // Create the unpublish action
    const action = {
      actionType: 'sanity.action.document.unpublish',
      draftId,
      publishedId: baseDocId
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Document ${baseDocId} unpublished successfully`,
      draftId,
      result
    };
  } catch (error: any) {
    console.error(`Error unpublishing document ${documentId}:`, error);
    throw new Error(`Failed to unpublish document: ${error.message}`);
  }
}

/**
 * Creates a new content release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - Unique ID for the release
 * @param title - Display title for the release
 * @returns Result of creating the release
 */
export async function createRelease(
  projectId: string, 
  dataset: string, 
  releaseId: string, 
  title?: string
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  result: any;
}> {
  try {
    // Create the release action
    const action = {
      actionType: 'sanity.action.release.create',
      releaseId,
      metadata: {
        title: title || `Release: ${releaseId}`
      }
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Release ${releaseId} created successfully`,
      releaseId,
      result
    };
  } catch (error: any) {
    console.error(`Error creating release ${releaseId}:`, error);
    throw new Error(`Failed to create release: ${error.message}`);
  }
}

/**
 * Adds a document to a content release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release
 * @param documentId - ID of the document to add to the release
 * @param content - Optional content changes to apply
 * @returns Result of adding the document to the release
 */
export async function addDocumentToRelease(
  projectId: string, 
  dataset: string, 
  releaseId: string, 
  documentId: string, 
  content?: Record<string, any>
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  documentId: string;
  versionId: string;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    const baseDocId = documentId.replace(/^drafts\./, '');
    
    // Determine if we need to fetch the current document content
    let attributes = content;
    
    if (!attributes) {
      // Fetch the current document content (try published first, then draft)
      try {
        attributes = await client.getDocument(baseDocId);
      } catch {
        // If published version doesn't exist, try draft
        attributes = await client.getDocument(`drafts.${baseDocId}`);
      }
      
      if (!attributes) {
        throw new Error(`Document ${baseDocId} not found`);
      }
    }
    
    // Create the version action
    const action = {
      actionType: 'sanity.action.document.version.create',
      publishedId: baseDocId,
      attributes: {
        ...attributes,
        _id: `versions.${releaseId}.${baseDocId}`
      }
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Document ${baseDocId} added to release ${releaseId} successfully`,
      releaseId,
      documentId: baseDocId,
      versionId: `versions.${releaseId}.${baseDocId}`,
      result
    };
  } catch (error: any) {
    console.error(`Error adding document ${documentId} to release ${releaseId}:`, error);
    throw new Error(`Failed to add document to release: ${error.message}`);
  }
}

interface ReleaseDocument {
  versionId: string;
  documentId: string;
  type: string;
  title: string;
}

/**
 * Lists all documents in a content release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release
 * @returns List of documents in the release
 */
export async function listReleaseDocuments(
  projectId: string, 
  dataset: string, 
  releaseId: string
): Promise<{
  releaseId: string;
  documentCount: number;
  documents: ReleaseDocument[];
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Query for all documents in the release
    const query = `*[_id match "versions.${releaseId}.*"]{ _id, _type, title }`;
    const documents = await client.fetch(query);
    
    // Map version documents to their base documents
    const mappedDocuments: ReleaseDocument[] = documents.map((doc: any) => {
      // Extract the base document ID from the version ID
      const baseId = doc._id.replace(`versions.${releaseId}.`, '');
      
      return {
        versionId: doc._id,
        documentId: baseId,
        type: doc._type,
        title: doc.title || `Untitled ${doc._type}`,
        // Add any other useful fields here
      };
    });
    
    return {
      releaseId,
      documentCount: mappedDocuments.length,
      documents: mappedDocuments
    };
  } catch (error: any) {
    console.error(`Error listing documents in release ${releaseId}:`, error);
    throw new Error(`Failed to list release documents: ${error.message}`);
  }
}

/**
 * Publishes all documents in a release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to publish
 * @returns Result of publishing the release
 */
export async function publishRelease(
  projectId: string, 
  dataset: string, 
  releaseId: string
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  documentCount: number;
  result: any;
}> {
  try {
    // First, check how many documents are in the release
    const documents = await listReleaseDocuments(projectId, dataset, releaseId);
    
    // Check if release exceeds document limit (50 docs per release as per docs)
    if (documents.documentCount > 50) {
      throw new Error(
        `Release contains ${documents.documentCount} documents, which exceeds the 50 document limit`
      );
    }
    
    // Create the publish release action
    const action = {
      actionType: 'sanity.action.release.publish',
      releaseId
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Release ${releaseId} published successfully`,
      releaseId,
      documentCount: documents.documentCount,
      result
    };
  } catch (error: any) {
    console.error(`Error publishing release ${releaseId}:`, error);
    throw new Error(`Failed to publish release: ${error.message}`);
  }
}
