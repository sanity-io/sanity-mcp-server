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
 * Publishes a document or multiple documents (makes draft the published version)
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - The document ID or array of IDs to publish
 * @returns Result of the publish operation
 */
export async function publishDocument(
  projectId: string, 
  dataset: string, 
  documentId: string | string[]
): Promise<{
  success: boolean;
  message: string;
  documentId?: string;
  documentIds?: string[];
  result: any;
}> {
  try {
    // Handle array of document IDs
    if (Array.isArray(documentId)) {
      const actions = documentId.map(id => {
        // Ensure document ID doesn't already have 'drafts.' prefix
        const baseDocId = id.replace(/^drafts\./, '');
        const draftId = `drafts.${baseDocId}`;
        
        return {
          actionType: 'sanity.action.document.publish',
          draftId,
          publishedId: baseDocId
        };
      });
      
      // Call the Actions API with all actions at once
      const result = await sanityApi.performActions(projectId, dataset, actions);
      
      return {
        success: true,
        message: `Published ${documentId.length} documents successfully`,
        documentIds: documentId.map(id => id.replace(/^drafts\./, '')),
        result
      };
    } 
    
    // Handle single document ID
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
    console.error(`Error publishing document:`, error);
    throw new Error(`Failed to publish document: ${error.message}`);
  }
}

/**
 * Unpublishes a document or multiple documents (keeps it as draft only)
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - The document ID or array of IDs to unpublish
 * @returns Result of the unpublish operation
 */
export async function unpublishDocument(
  projectId: string, 
  dataset: string, 
  documentId: string | string[]
): Promise<{
  success: boolean;
  message: string;
  draftId?: string;
  draftIds?: string[];
  result: any;
}> {
  try {
    // Handle array of document IDs
    if (Array.isArray(documentId)) {
      const actions = documentId.map(id => {
        // Ensure document ID doesn't already have 'drafts.' prefix
        const baseDocId = id.replace(/^drafts\./, '');
        
        return {
          actionType: 'sanity.action.document.unpublish',
          documentId: baseDocId
        };
      });
      
      // Call the Actions API with all actions at once
      const result = await sanityApi.performActions(projectId, dataset, actions);
      
      return {
        success: true,
        message: `Unpublished ${documentId.length} documents successfully`,
        draftIds: documentId.map(id => `drafts.${id.replace(/^drafts\./, '')}`),
        result
      };
    }
    
    // Handle single document ID
    // Ensure document ID doesn't already have 'drafts.' prefix
    const baseDocId = documentId.replace(/^drafts\./, '');
    
    // Create the unpublish action
    const action = {
      actionType: 'sanity.action.document.unpublish',
      documentId: baseDocId
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Document ${baseDocId} unpublished successfully`,
      draftId: `drafts.${baseDocId}`,
      result
    };
  } catch (error: any) {
    console.error(`Error unpublishing document:`, error);
    throw new Error(`Failed to unpublish document: ${error.message}`);
  }
}

/**
 * Creates one or more new documents in Sanity
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documents - The document or array of documents to create
 * @param options - Additional options
 * @returns Result of the create operation
 */
export async function createDocument(
  projectId: string, 
  dataset: string, 
  documents: Record<string, any> | Record<string, any>[],
  options?: {
    ifExists?: 'fail' | 'ignore'
  }
): Promise<{
  success: boolean;
  message: string;
  documentId?: string;
  documentIds?: string[];
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Handle array of documents
    if (Array.isArray(documents)) {
      if (documents.length === 0) {
        throw new Error('Empty array of documents provided');
      }
      
      // Validate and prepare each document
      const preparedDocs = documents.map(doc => {
        // Ensure document has _type
        if (!doc._type) {
          throw new Error('Document must have a _type field');
        }
        
        // If document has _id, make sure it's properly formatted
        if (doc._id && !doc._id.startsWith('drafts.')) {
          return { ...doc, _id: `drafts.${doc._id}` };
        }
        
        return doc;
      });
      
      // Create documents based on options
      let results;
      const transaction = client.transaction();
      
      for (const doc of preparedDocs) {
        if (options?.ifExists === 'ignore' && doc._id) {
          transaction.createIfNotExists(doc as IdentifiedSanityDocumentStub<Record<string, any>>);
        } else {
          transaction.create(doc as SanityDocumentStub<{ _type: string }>);
        }
      }
      
      // Commit all document creations at once
      results = await transaction.commit();
      
      return {
        success: true,
        message: `${preparedDocs.length} documents created successfully`,
        documentIds: results.results.map((res: any) => res.id),
        result: results
      };
    }
    
    // Handle single document
    const document = documents;
    
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
 * Edits one or more existing documents with patches
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - The document ID or array of IDs to edit
 * @param patch - The patch operations to apply to each document
 * @returns Result of the edit operation
 */
export async function editDocument(
  projectId: string, 
  dataset: string, 
  documentId: string | string[], 
  patch: Record<string, any>
): Promise<{
  success: boolean;
  message: string;
  documentId?: string;
  documentIds?: string[];
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Handle array of document IDs
    if (Array.isArray(documentId)) {
      if (documentId.length === 0) {
        throw new Error('Empty array of document IDs provided');
      }
      
      // Process each document ID
      const transaction = client.transaction();
      
      for (const id of documentId) {
        // Ensure ID points to a draft document
        const draftId = id.startsWith('drafts.') ? id : `drafts.${id}`;
        
        // Create a patch for each document
        const patchOps = client.patch(draftId);
        
        // Apply all patch operations
        if (patch.set) patchOps.set(patch.set);
        if (patch.setIfMissing) patchOps.setIfMissing(patch.setIfMissing);
        if (patch.unset) patchOps.unset(patch.unset);
        if (patch.inc) patchOps.inc(patch.inc);
        if (patch.dec) patchOps.dec(patch.dec);
        
        // Add the patch to the transaction
        transaction.patch(patchOps);
      }
      
      // Commit all patches at once
      const result = await transaction.commit();
      
      return {
        success: true,
        message: `Edited ${documentId.length} documents successfully`,
        documentIds: documentId.map(id => id.startsWith('drafts.') ? id : `drafts.${id}`),
        result
      };
    }
    
    // Handle single document ID
    // Ensure ID points to a draft document
    const draftId = documentId.startsWith('drafts.') ? documentId : `drafts.${documentId}`;
    
    // Create a patch
    const transaction = client.patch(draftId);
    
    // Apply all patch operations
    if (patch.set) transaction.set(patch.set);
    if (patch.setIfMissing) transaction.setIfMissing(patch.setIfMissing);
    if (patch.unset) transaction.unset(patch.unset);
    if (patch.inc) transaction.inc(patch.inc);
    if (patch.dec) transaction.dec(patch.dec);
    
    // Commit the patch
    const result = await transaction.commit();
    
    return {
      success: true,
      message: `Document ${draftId} edited successfully`,
      documentId: draftId,
      result
    };
  } catch (error: any) {
    console.error(`Error editing document:`, error);
    throw new Error(`Failed to edit document: ${error.message}`);
  }
}

/**
 * Deletes one or more documents and optionally their drafts
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - The document ID or array of IDs to delete
 * @param options - Additional options
 * @returns Result of the delete operation
 */
export async function deleteDocument(
  projectId: string, 
  dataset: string, 
  documentId: string | string[],
  options?: {
    includeDrafts?: string[];
    purge?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  documentId?: string;
  documentIds?: string[];
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Handle array of document IDs
    if (Array.isArray(documentId)) {
      if (documentId.length === 0) {
        throw new Error('Empty array of document IDs provided');
      }
      
      // Process each document ID
      const transaction = client.transaction();
      const processedIds = [];
      
      for (const id of documentId) {
        // Ensure document ID doesn't already have 'drafts.' prefix
        const baseDocId = id.replace(/^drafts\./, '');
        const draftId = `drafts.${baseDocId}`;
        
        // Delete the published document
        transaction.delete(baseDocId);
        
        // Delete the draft document
        transaction.delete(draftId);
        
        processedIds.push(baseDocId);
      }
      
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
        message: `${processedIds.length} documents deleted successfully`,
        documentIds: processedIds,
        result
      };
    }
    
    // Handle single document ID
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
    console.error(`Error deleting document:`, error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

/**
 * Replaces one or more existing draft documents
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documents - The replacement document or array of documents
 * @returns Result of the replace operation
 */
export async function replaceDraftDocument(
  projectId: string, 
  dataset: string, 
  documents: Record<string, any> | Record<string, any>[]
): Promise<{
  success: boolean;
  message: string;
  documentId?: string;
  documentIds?: string[];
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Handle array of documents
    if (Array.isArray(documents)) {
      if (documents.length === 0) {
        throw new Error('Empty array of documents provided');
      }
      
      // Validate and prepare each document
      const preparedDocs = documents.map(doc => {
        // Ensure document has _type and _id
        if (!doc._type) {
          throw new Error('Document must have a _type field');
        }
        
        if (!doc._id) {
          throw new Error('Document must have an _id field to replace');
        }
        
        // Ensure document ID is a draft
        if (!doc._id.startsWith('drafts.')) {
          return { ...doc, _id: `drafts.${doc._id}` };
        }
        
        return doc;
      });
      
      // Replace documents in a single transaction
      const transaction = client.transaction();
      
      for (const doc of preparedDocs) {
        transaction.createOrReplace(doc as IdentifiedSanityDocumentStub<Record<string, any>>);
      }
      
      const results = await transaction.commit();
      
      return {
        success: true,
        message: `${preparedDocs.length} draft documents replaced successfully`,
        documentIds: preparedDocs.map(doc => doc._id),
        result: results
      };
    }
    
    // Handle single document
    const document = documents;
    
    // Ensure document has required fields
    if (!document._type) {
      throw new Error('Document must have a _type field');
    }
    
    if (!document._id) {
      throw new Error('Document must have an _id field to replace');
    }
    
    // Ensure document ID is a draft
    if (!document._id.startsWith('drafts.')) {
      document._id = `drafts.${document._id}`;
    }
    
    // Replace the document
    const result = await client.createOrReplace(document as IdentifiedSanityDocumentStub<Record<string, any>>);
    
    return {
      success: true,
      message: `Draft document ${document._id} replaced successfully`,
      documentId: document._id,
      result
    };
  } catch (error: any) {
    console.error(`Error replacing draft document:`, error);
    throw new Error(`Failed to replace draft document: ${error.message}`);
  }
}

/**
 * Creates document versions in a specific release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to add the document version to
 * @param documentId - ID or array of IDs of the document(s) to create a version of
 * @param content - Optional content to use for the version
 * @returns Result of the create version operation
 */
export async function createDocumentVersion(
  projectId: string, 
  dataset: string, 
  releaseId: string, 
  documentId: string | string[],
  content?: Record<string, any>
): Promise<{
  success: boolean;
  message: string;
  versionId?: string;
  versionIds?: string[];
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Handle array of document IDs
    if (Array.isArray(documentId)) {
      if (documentId.length === 0) {
        throw new Error('Empty array of document IDs provided');
      }
      
      const versionIds = [];
      const results = [];
      
      // Process each document ID
      for (const id of documentId) {
        // Ensure document ID doesn't already have 'drafts.' prefix
        const baseDocId = id.replace(/^drafts\./, '');
        const draftId = `drafts.${baseDocId}`;
        
        // Try to get document content
        let documentContent;
        try {
          // First try to get the draft version
          documentContent = await client.getDocument(draftId);
          
          // If draft not found, try the published version
          if (!documentContent) {
            documentContent = await client.getDocument(baseDocId);
          }
        } catch (e) {
          // If content parameter is provided, we'll use that instead
          if (!content) {
            throw new Error(`Document ${baseDocId} not found`);
          }
        }
        
        // Create version document
        const versionDoc = {
          _type: 'release.version',
          _id: `release.version.${releaseId}.${baseDocId}`,
          releaseId,
          documentId: baseDocId,
          content: content || documentContent
        };
        
        // Create the version
        const result = await client.create(versionDoc);
        versionIds.push(result._id);
        results.push(result);
      }
      
      return {
        success: true,
        message: `Created ${versionIds.length} document versions for release ${releaseId}`,
        versionIds,
        result: results
      };
    }
    
    // Handle single document ID
    // Ensure document ID doesn't already have 'drafts.' prefix
    const baseDocId = documentId.replace(/^drafts\./, '');
    const draftId = `drafts.${baseDocId}`;
    
    // Try to get document content
    let documentContent;
    try {
      // First try to get the draft version
      documentContent = await client.getDocument(draftId);
      
      // If draft not found, try the published version
      if (!documentContent) {
        documentContent = await client.getDocument(baseDocId);
      }
    } catch (e) {
      // If content parameter is provided, we'll use that instead
      if (!content) {
        throw new Error(`Document ${baseDocId} not found`);
      }
    }
    
    // Create version document
    const versionDoc = {
      _type: 'release.version',
      _id: `release.version.${releaseId}.${baseDocId}`,
      releaseId,
      documentId: baseDocId,
      content: content || documentContent
    };
    
    // Create the version
    const result = await client.create(versionDoc);
    
    return {
      success: true,
      message: `Document version created for ${baseDocId} in release ${releaseId}`,
      versionId: result._id,
      result
    };
  } catch (error: any) {
    console.error(`Error creating document version:`, error);
    throw new Error(`Failed to create document version: ${error.message}`);
  }
}

/**
 * Discards one or more specific versions of documents
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param versionId - ID or array of IDs of the version(s) to discard
 * @param options - Additional options
 * @returns Result of the discard operation
 */
export async function discardDocumentVersion(
  projectId: string, 
  dataset: string, 
  versionId: string | string[],
  options?: {
    purge?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  versionId?: string;
  versionIds?: string[];
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Handle array of version IDs
    if (Array.isArray(versionId)) {
      if (versionId.length === 0) {
        throw new Error('Empty array of version IDs provided');
      }
      
      // Use a transaction to delete all versions at once
      const transaction = client.transaction();
      
      for (const id of versionId) {
        transaction.delete(id);
      }
      
      // Commit with purge option if specified
      const result = await transaction.commit({
        visibility: options?.purge ? 'async' : 'sync'
      });
      
      return {
        success: true,
        message: `Discarded ${versionId.length} document versions`,
        versionIds: versionId,
        result
      };
    }
    
    // Handle single version ID
    const result = await client.delete(versionId, {
      // If purge is true, completely remove from history
      visibility: options?.purge ? 'async' : 'sync'
    });
    
    return {
      success: true,
      message: `Document version ${versionId} discarded successfully`,
      versionId,
      result
    };
  } catch (error: any) {
    console.error(`Error discarding document version:`, error);
    throw new Error(`Failed to discard document version: ${error.message}`);
  }
}

/**
 * Marks one or more documents for unpublishing when a release is published
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release
 * @param documentId - ID or array of IDs of the document(s) to unpublish
 * @returns Result of the unpublish with release operation
 */
export async function unpublishDocumentWithRelease(
  projectId: string, 
  dataset: string, 
  releaseId: string,
  documentId: string | string[]
): Promise<{
  success: boolean;
  message: string;
  documentId?: string;
  documentIds?: string[];
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Handle array of document IDs
    if (Array.isArray(documentId)) {
      if (documentId.length === 0) {
        throw new Error('Empty array of document IDs provided');
      }
      
      const unpublishDocs = [];
      const results = [];
      
      // Process each document ID
      for (const id of documentId) {
        // Ensure document ID doesn't already have 'drafts.' prefix
        const baseDocId = id.replace(/^drafts\./, '');
        
        // Create unpublish document
        const unpublishDoc = {
          _type: 'release.unpublish',
          _id: `release.unpublish.${releaseId}.${baseDocId}`,
          releaseId,
          documentId: baseDocId
        };
        
        // Create the unpublish record
        const result = await client.create(unpublishDoc);
        unpublishDocs.push(baseDocId);
        results.push(result);
      }
      
      return {
        success: true,
        message: `Marked ${unpublishDocs.length} documents for unpublishing with release ${releaseId}`,
        documentIds: unpublishDocs,
        result: results
      };
    }
    
    // Handle single document ID
    // Ensure document ID doesn't already have 'drafts.' prefix
    const baseDocId = documentId.replace(/^drafts\./, '');
    
    // Create unpublish document
    const unpublishDoc = {
      _type: 'release.unpublish',
      _id: `release.unpublish.${releaseId}.${baseDocId}`,
      releaseId,
      documentId: baseDocId
    };
    
    // Create the unpublish record
    const result = await client.create(unpublishDoc);
    
    return {
      success: true,
      message: `Document ${baseDocId} marked for unpublishing with release ${releaseId}`,
      documentId: baseDocId,
      result
    };
  } catch (error: any) {
    console.error(`Error marking document for unpublishing:`, error);
    throw new Error(`Failed to mark document for unpublishing: ${error.message}`);
  }
}
