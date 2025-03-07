import { createSanityClient, sanityApi } from '../utils/sanityClient.js';
import { 
  normalizeDraftId, 
  normalizeBaseDocId, 
  applyPatchOperations, 
  getDocumentContent,
  createErrorResponse,
  normalizeDocumentIds
} from '../utils/documentHelpers.js';
import { 
  SanityClient, 
  SanityDocument, 
  SanityTransaction, 
  SanityActionResult,
  SanityMutationResult,
  PatchOperations,
  SanityError
} from '../types/sanity.js';

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
  result: SanityActionResult;
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
  result: SanityActionResult;
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
  client: SanityClient,
  documents: Record<string, any>[],
  options?: { ifExists?: 'fail' | 'ignore' }
): Promise<{ result: SanityMutationResult, count: number, ids: string[] }> {
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
    result: results,
    count: preparedDocs.length,
    ids: results.results.map((res: any) => res.id)
  };
}

/**
 * Creates a single document
 */
async function createSingleDocument(
  client: SanityClient,
  document: Record<string, any>,
  options?: { ifExists?: 'fail' | 'ignore' }
): Promise<{ result: SanityMutationResult, id: string }> {
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
  result: SanityMutationResult;
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
        result: result.result
      };
    }
    
    // Handle single document
    const result = await createSingleDocument(client, documents, options);
    
    return {
      success: true,
      message: `Document created successfully with ID: ${result.id}`,
      documentId: result.id,
      result: result.result
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
  patch: PatchOperations
): Promise<{
  success: boolean;
  message: string;
  documentId?: string;
  documentIds?: string[];
  result: SanityMutationResult;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Process document IDs
    const documentIds = normalizeDocumentIds(documentId);
    
    if (documentIds.length === 0) {
      return createErrorResponse('No valid document IDs provided');
    }
    
    let result;
    let processedIds: string[];
    
    if (documentIds.length === 1) {
      const response = await editSingleDocument(client, documentIds[0], patch);
      result = response.result;
      processedIds = response.processedIds;
    } else {
      const response = await editMultipleDocuments(client, documentIds, patch);
      result = response.result;
      processedIds = response.processedIds;
    }
    
    return {
      success: true,
      message: `Successfully edited ${processedIds.length} document(s)`,
      documentIds: processedIds,
      result
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Failed to edit document(s): ${errorMessage}`);
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
  result: SanityMutationResult;
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
  transaction: SanityTransaction,
  documentIds: string[],
  additionalDrafts?: string[]
): { transaction: SanityTransaction, processedIds: string[] } {
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
  client: SanityClient,
  documentIds: string[],
  options?: {
    includeDrafts?: string[];
    purge?: boolean;
  }
): Promise<{ result: SanityMutationResult, processedIds: string[] }> {
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
  result: SanityMutationResult;
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
  client: SanityClient, 
  documentId: string, 
  patch: PatchOperations
): Promise<{ result: SanityMutationResult, processedIds: string[] }> {
  const draftId = normalizeDraftId(documentId);
  const transaction = client.transaction();
  
  // Create the patch operation on the draft document
  const patchObj = client.patch(draftId);
  applyPatchOperations(patch, patchObj);
  
  // Add the patch to the transaction
  transaction.patch(patchObj);
  
  // Commit the transaction
  const result = await transaction.commit();
  
  return {
    result: {
      documentId: draftId,
      transactionId: result.transactionId,
      results: result.results
    },
    processedIds: [draftId]
  };
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
  client: SanityClient,
  documentIds: string[], 
  patch: PatchOperations
): Promise<{ result: SanityMutationResult, processedIds: string[] }> {
  // Normalize all document IDs to draft IDs
  const draftIds = documentIds.map(id => normalizeDraftId(id));
  
  // Create a transaction for batch operations
  const transaction = client.transaction();
  
  // Apply the patch to each document
  draftIds.forEach(id => {
    const patchObj = client.patch(id);
    applyPatchOperations(patch, patchObj);
    transaction.patch(patchObj);
  });
  
  // Commit the transaction
  const result = await transaction.commit();
  
  return {
    result: {
      documentId: draftIds[0], // Return the first ID for backward compatibility
      transactionId: result.transactionId,
      results: result.results
    },
    processedIds: draftIds
  };
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
  client: SanityClient,
  releaseId: string,
  documentId: string,
  content?: Record<string, any>
): Promise<SanityDocument> {
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
  result: SanityMutationResult;
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
  result: SanityMutationResult;
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
  result: SanityMutationResult;
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
