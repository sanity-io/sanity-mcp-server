import { createSanityClient, sanityApi } from '../utils/sanityClient.js';
import { 
  normalizeDraftId, 
  normalizeBaseDocId, 
  applyPatchOperations, 
  getDocumentContent,
  createErrorResponse
} from '../utils/documentHelpers.js';

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
 * Prepares a single document for creation, ensuring proper formatting and validation
 */
function prepareDocumentForCreation(document: Record<string, any>): Record<string, any> {
  // Ensure document has _type
  if (!document._type) {
    throw new Error('Document must have a _type field');
  }
  
  // If document has _id, make sure it's properly formatted
  if (document._id && !document._id.startsWith('drafts.')) {
    return { ...document, _id: `drafts.${document._id}` };
  }
  
  return document;
}

/**
 * Creates multiple documents in a single transaction
 */
async function createMultipleDocuments(
  client: any,
  documents: Record<string, any>[],
  options?: { ifExists?: 'fail' | 'ignore' }
): Promise<any> {
  // Validate and prepare each document
  const preparedDocs = documents.map(prepareDocumentForCreation);
  
  // Create documents based on options
  const transaction = client.transaction();
  
  for (const doc of preparedDocs) {
    if (options?.ifExists === 'ignore' && doc._id) {
      transaction.createIfNotExists(doc as IdentifiedSanityDocumentStub<Record<string, any>>);
    } else {
      transaction.create(doc as SanityDocumentStub<{ _type: string }>);
    }
  }
  
  // Commit all document creations at once
  const results = await transaction.commit();
  
  return {
    results,
    count: preparedDocs.length,
    ids: results.results.map((res: any) => res.id)
  };
}

/**
 * Creates a single document
 */
async function createSingleDocument(
  client: any,
  document: Record<string, any>,
  options?: { ifExists?: 'fail' | 'ignore' }
): Promise<any> {
  const preparedDoc = prepareDocumentForCreation(document);
  
  // Handle ifExists option
  if (options?.ifExists === 'ignore' && preparedDoc._id) {
    // Use createIfNotExists if we want to ignore existing docs
    return await client.createIfNotExists(preparedDoc as IdentifiedSanityDocumentStub<Record<string, any>>);
  } else {
    // Default behavior - just create
    return await client.create(preparedDoc as SanityDocumentStub<{ _type: string }>);
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
      
      const result = await createMultipleDocuments(client, documents, options);
      
      return {
        success: true,
        message: `${result.count} documents created successfully`,
        documentIds: result.ids,
        result
      };
    }
    
    // Handle single document
    const result = await createSingleDocument(client, documents, options);
    
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
      const result = await editMultipleDocuments(client, documentId, patch);
      
      return {
        success: true,
        message: `Edited ${documentId.length} documents successfully`,
        documentIds: documentId.map(id => normalizeDraftId(id)),
        result
      };
    }
    
    // Handle single document ID
    const draftId = normalizeDraftId(documentId);
    const result = await editSingleDocument(client, documentId, patch);
    
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
      
      const { result, processedIds } = await deleteMultipleDocuments(client, documentId, options);
      
      return {
        success: true,
        message: `${processedIds.length} documents deleted successfully`,
        documentIds: processedIds,
        result
      };
    }
    
    // Handle single document ID
    const { baseDocId, draftId } = prepareDocumentIdForDeletion(documentId);
    
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
      // If purge is true, completely remove from history
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
 * Prepares document IDs for deletion by normalizing them and creating base and draft IDs
 */
function prepareDocumentIdForDeletion(id: string): { baseDocId: string, draftId: string } {
  // Ensure document ID doesn't already have 'drafts.' prefix
  const baseDocId = id.replace(/^drafts\./, '');
  const draftId = `drafts.${baseDocId}`;
  
  return { baseDocId, draftId };
}

/**
 * Sets up a transaction for deleting multiple documents
 */
function setupDeleteTransaction(
  transaction: any,
  documentIds: string[],
  additionalDrafts?: string[]
): { transaction: any, processedIds: string[] } {
  const processedIds = [];
  
  // Process each document ID
  for (const id of documentIds) {
    const { baseDocId, draftId } = prepareDocumentIdForDeletion(id);
    
    // Delete the published document
    transaction.delete(baseDocId);
    
    // Delete the draft document
    transaction.delete(draftId);
    
    processedIds.push(baseDocId);
  }
  
  // Delete any additional draft IDs specified
  if (additionalDrafts && additionalDrafts.length > 0) {
    additionalDrafts.forEach(id => {
      transaction.delete(id);
    });
  }
  
  return { transaction, processedIds };
}

/**
 * Deletes multiple documents in a transaction
 */
async function deleteMultipleDocuments(
  client: any,
  documentIds: string[],
  options?: {
    includeDrafts?: string[];
    purge?: boolean;
  }
): Promise<{ result: any, processedIds: string[] }> {
  // Process each document ID
  const transaction = client.transaction();
  
  const { transaction: updatedTransaction, processedIds } = setupDeleteTransaction(
    transaction,
    documentIds,
    options?.includeDrafts
  );
  
  // Commit the transaction
  const result = await updatedTransaction.commit({
    // If purge is true, completely remove document from history
    visibility: options?.purge ? 'async' : 'sync'
  });
  
  return { result, processedIds };
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
 * Edits a single document with the given patch
 * 
 * @param client - Sanity client
 * @param documentId - The document ID to edit
 * @param patch - The patch operations to apply
 * @returns Result of the edit operation
 */
async function editSingleDocument(
  client: any, 
  documentId: string, 
  patch: Record<string, any>
): Promise<any> {
  const draftId = normalizeDraftId(documentId);
  
  // Create a patch
  const transaction = client.patch(draftId);
  
  // Apply all patch operations
  applyPatchOperations(patch, transaction);
  
  // Commit the patch
  return await transaction.commit();
}

/**
 * Edits multiple documents with the given patch
 * 
 * @param client - Sanity client
 * @param documentIds - Array of document IDs to edit
 * @param patch - The patch operations to apply to each document
 * @returns Result of the edit operation
 */
async function editMultipleDocuments(
  client: any, 
  documentIds: string[], 
  patch: Record<string, any>
): Promise<any> {
  if (documentIds.length === 0) {
    throw new Error('Empty array of document IDs provided');
  }
  
  // Process each document ID
  const transaction = client.transaction();
  
  for (const id of documentIds) {
    // Ensure ID points to a draft document
    const draftId = normalizeDraftId(id);
    
    // Create a patch for each document
    const patchOps = client.patch(draftId);
    
    // Apply all patch operations
    applyPatchOperations(patch, patchOps);
    
    // Add the patch to the transaction
    transaction.patch(patchOps);
  }
  
  // Commit all patches at once
  return await transaction.commit();
}

/**
 * Creates a version document for a single document
 * 
 * @param client - Sanity client
 * @param releaseId - ID of the release
 * @param documentId - ID of the document
 * @param content - Optional content to use instead of the document's content
 * @returns The created version document
 */
async function createSingleDocumentVersion(
  client: any,
  releaseId: string,
  documentId: string,
  content?: Record<string, any>
): Promise<any> {
  const baseDocId = normalizeBaseDocId(documentId);
  
  // Get document content
  const documentContent = await getDocumentContent(client, documentId, content);
  
  // Create version document
  const versionDoc = {
    _type: 'release.version',
    _id: `release.version.${releaseId}.${baseDocId}`,
    releaseId,
    documentId: baseDocId,
    content: content || documentContent
  };
  
  // Create the version
  return await client.create(versionDoc);
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
        const result = await createSingleDocumentVersion(client, releaseId, id, content);
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
    const result = await createSingleDocumentVersion(client, releaseId, documentId, content);
    
    return {
      success: true,
      message: `Document version created for ${normalizeBaseDocId(documentId)} in release ${releaseId}`,
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
