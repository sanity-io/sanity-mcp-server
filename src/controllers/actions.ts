import { createSanityClient, sanityApi } from '../utils/sanityClient.js';

// Define types for Sanity documents
interface SanityDocumentStub<T extends { _type: string }> {
  _type: string;
  [key: string]: any;
}

interface IdentifiedSanityDocumentStub<T extends Record<string, any>> extends SanityDocumentStub<T & { _type: string }> {
  _id: string;
}

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
 * Creates a new document in Sanity
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param document - The document to create
 * @param options - Additional options
 * @returns Result of the create operation
 */
export async function createDocument(
  projectId: string, 
  dataset: string, 
  document: Record<string, any>,
  options?: {
    ifExists?: 'fail' | 'ignore'
  }
): Promise<{
  success: boolean;
  message: string;
  documentId: string;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Ensure document has _type
    if (!document._type) {
      throw new Error('Document must have a _type field');
    }
    
    // If document has _id, make sure it's properly formatted
    if (document._id && !document._id.startsWith('drafts.')) {
      document._id = `drafts.${document._id}`;
    }
    
    let result;
    
    // Handle ifExists option
    if (options?.ifExists === 'ignore' && document._id) {
      // Use createIfNotExists if we want to ignore existing docs
      result = await client.createIfNotExists(document as IdentifiedSanityDocumentStub<Record<string, any>>);
    } else {
      // Default behavior - just create
      result = await client.create(document as SanityDocumentStub<{ _type: string }>);
    }
    
    return {
      success: true,
      message: `Document created successfully with ID: ${result._id}`,
      documentId: result._id,
      result
    };
  } catch (error: any) {
    console.error(`Error creating document:`, error);
    throw new Error(`Failed to create document: ${error.message}`);
  }
}

/**
 * Edits an existing document with a patch
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - The document ID to edit
 * @param patch - The patch operations to apply
 * @returns Result of the edit operation
 */
export async function editDocument(
  projectId: string, 
  dataset: string, 
  documentId: string, 
  patch: Record<string, any>
): Promise<{
  success: boolean;
  message: string;
  documentId: string;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Ensure document ID is properly formatted
    const draftId = documentId.startsWith('drafts.') 
      ? documentId 
      : `drafts.${documentId}`;
    
    // Create a patch object
    const transaction = client.patch(draftId);
    
    // Apply patch operations
    if (patch.set) {
      transaction.set(patch.set);
    }
    
    if (patch.setIfMissing) {
      transaction.setIfMissing(patch.setIfMissing);
    }
    
    if (patch.unset) {
      transaction.unset(patch.unset);
    }
    
    if (patch.inc) {
      transaction.inc(patch.inc);
    }
    
    if (patch.dec) {
      transaction.dec(patch.dec);
    }
    
    if (patch.insert) {
      const { items, position, at } = patch.insert;
      transaction.insert(position, at, items);
    }
    
    // Commit the transaction
    const result = await transaction.commit();
    
    return {
      success: true,
      message: `Document ${draftId} edited successfully`,
      documentId: draftId,
      result
    };
  } catch (error: any) {
    console.error(`Error editing document ${documentId}:`, error);
    throw new Error(`Failed to edit document: ${error.message}`);
  }
}

/**
 * Deletes a document and optionally its drafts
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - The document ID to delete
 * @param options - Additional options
 * @returns Result of the delete operation
 */
export async function deleteDocument(
  projectId: string, 
  dataset: string, 
  documentId: string,
  options?: {
    includeDrafts?: string[];
    purge?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  documentId: string;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Ensure document ID doesn't already have 'drafts.' prefix
    const baseDocId = documentId.replace(/^drafts\./, '');
    const draftId = `drafts.${baseDocId}`;
    
    // Start a transaction
    const transaction = client.transaction();
    
    // Delete the published document
    transaction.delete(baseDocId);
    
    // Delete the draft document
    transaction.delete(draftId);
    
    // Delete any additional draft IDs specified
    if (options?.includeDrafts && options.includeDrafts.length > 0) {
      options.includeDrafts.forEach(id => {
        transaction.delete(id);
      });
    }
    
    // Commit the transaction
    const result = await transaction.commit({
      // If purge is true, completely remove document from history
      visibility: options?.purge ? 'async' : 'sync'
    });
    
    return {
      success: true,
      message: `Document ${baseDocId} deleted successfully`,
      documentId: baseDocId,
      result
    };
  } catch (error: any) {
    console.error(`Error deleting document ${documentId}:`, error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

/**
 * Replaces an existing draft document
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param document - The replacement document
 * @returns Result of the replace operation
 */
export async function replaceDraftDocument(
  projectId: string, 
  dataset: string, 
  document: Record<string, any>
): Promise<{
  success: boolean;
  message: string;
  documentId: string;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Ensure document has _id and _type
    if (!document._id) {
      throw new Error('Document must have an _id field');
    }
    
    if (!document._type) {
      throw new Error('Document must have a _type field');
    }
    
    // Ensure document ID is in draft format
    if (!document._id.startsWith('drafts.')) {
      document._id = `drafts.${document._id}`;
    }
    
    // Replace the document
    const result = await client.createOrReplace(document as IdentifiedSanityDocumentStub<Record<string, any>>);
    
    return {
      success: true,
      message: `Document ${document._id} replaced successfully`,
      documentId: document._id,
      result
    };
  } catch (error: any) {
    console.error(`Error replacing document:`, error);
    throw new Error(`Failed to replace document: ${error.message}`);
  }
}

/**
 * Creates a document version in a specific release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to add the document version to
 * @param documentId - ID of the document to create a version of
 * @param content - Optional content to use for the version
 * @returns Result of the create version operation
 */
export async function createDocumentVersion(
  projectId: string, 
  dataset: string, 
  releaseId: string, 
  documentId: string,
  content?: Record<string, any>
): Promise<{
  success: boolean;
  message: string;
  versionId: string;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Ensure document ID doesn't have 'drafts.' prefix
    const baseDocId = documentId.replace(/^drafts\./, '');
    
    // If content is provided, use it, otherwise fetch the current document
    let documentContent = content;
    
    if (!documentContent) {
      // Fetch the current document content
      documentContent = await client.getDocument(baseDocId);
      
      if (!documentContent) {
        throw new Error(`Document ${baseDocId} not found`);
      }
    }
    
    // Create a version document
    const versionDoc = {
      _type: 'release.version',
      releaseId: releaseId,
      documentId: baseDocId,
      content: documentContent
    };
    
    const result = await client.create(versionDoc);
    
    return {
      success: true,
      message: `Version created for document ${baseDocId} in release ${releaseId}`,
      versionId: result._id,
      result
    };
  } catch (error: any) {
    console.error(`Error creating document version:`, error);
    throw new Error(`Failed to create document version: ${error.message}`);
  }
}

/**
 * Discards a specific version of a document
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param versionId - ID of the version to discard
 * @param options - Additional options
 * @returns Result of the discard operation
 */
export async function discardDocumentVersion(
  projectId: string, 
  dataset: string, 
  versionId: string,
  options?: {
    purge?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  versionId: string;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Delete the version document
    const result = await client.delete(versionId, {
      // If purge is true, completely remove from history
      visibility: options?.purge ? 'async' : 'sync'
    });
    
    return {
      success: true,
      message: `Version ${versionId} discarded successfully`,
      versionId: versionId,
      result
    };
  } catch (error: any) {
    console.error(`Error discarding document version ${versionId}:`, error);
    throw new Error(`Failed to discard document version: ${error.message}`);
  }
}

/**
 * Marks a document for unpublishing when a release is published
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release
 * @param documentId - ID of the document to unpublish
 * @returns Result of the unpublish with release operation
 */
export async function unpublishDocumentWithRelease(
  projectId: string, 
  dataset: string, 
  releaseId: string,
  documentId: string
): Promise<{
  success: boolean;
  message: string;
  documentId: string;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Ensure document ID doesn't have 'drafts.' prefix
    const baseDocId = documentId.replace(/^drafts\./, '');
    
    // Create an unpublish record for the release
    const unpublishDoc = {
      _type: 'release.unpublish',
      releaseId: releaseId,
      documentId: baseDocId
    };
    
    const result = await client.create(unpublishDoc);
    
    return {
      success: true,
      message: `Document ${baseDocId} marked for unpublishing in release ${releaseId}`,
      documentId: baseDocId,
      result
    };
  } catch (error: any) {
    console.error(`Error setting up unpublish with release:`, error);
    throw new Error(`Failed to set up document unpublish with release: ${error.message}`);
  }
}
