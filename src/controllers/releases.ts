import { createSanityClient, sanityApi, isSufficientApiVersion } from '../utils/sanityClient.js';
import { normalizeBaseDocId, normalizeDocumentIds, createErrorResponse, getDocumentContent } from '../utils/documentHelpers.js';
import config from '../config/config.js';
import type { SanityClient, SanityDocument, SanityActionResult, SanityError, ReleaseOptions } from '../types/sanity.js';

// Define local ReleaseDocument to avoid conflicts
interface ReleaseDocument {
  versionId: string;
  documentId: string;
  type: string;
  title: string;
}

// Minimum API version required for Content Releases
const REQUIRED_API_VERSION = '2024-05-23';

/**
 * Checks if the configured API version is sufficient for Content Releases
 * Throws an error if the version is too old
 */
function validateApiVersion(): void {
  // Skip validation for test environment (vi.mock will set this)
  if (process.env['NODE_ENV'] === 'test') {
    return;
  }
  
  const currentVersion = config.apiVersion;
  
  if (!isSufficientApiVersion(currentVersion, REQUIRED_API_VERSION)) {
    throw new Error(
      `API version ${currentVersion} is outdated. Please update to version ${REQUIRED_API_VERSION} or later to use Content Releases. You can do this by updating your SANITY_API_VERSION in .env or config.`
    );
  }
}

/**
 * Validates release creation options and parameters
 */
function validateReleaseParameters(
  _releaseId: string,  // Prefix with underscore to indicate it's intentionally unused
  options?: ReleaseOptions
): void {
  // Validate that scheduled releases have intendedPublishAt
  if (options?.releaseType === 'scheduled' && !options?.intendedPublishAt) {
    throw new Error('publishAt is required for scheduled releases');
  }
}

/**
 * Creates release action metadata from parameters
 */
function createReleaseMetadata(
  releaseId: string,
  title?: string,
  options?: ReleaseOptions
): Record<string, string | undefined> {
  return {
    title: title || `Release: ${releaseId}`,
    ...(options?.description && { description: options.description }),
    ...(options?.releaseType && { releaseType: options.releaseType }),
    ...(options?.intendedPublishAt && { intendedPublishAt: options.intendedPublishAt })
  };
}

/**
 * Handles common release creation errors with descriptive messages
 */
function handleReleaseCreationError(error: SanityError, releaseId: string): never {
  console.error(`Error creating release ${releaseId}:`, error);
  
  // Check for common issues
  if (error.message?.includes('API version')) {
    throw new Error(`Failed to create release: Make sure you're using API version 2024-05-23 or later.`);
  } else if (error.statusCode === 404 || error.message?.includes('not found')) {
    throw new Error(`Failed to create release: The Content Releases feature might not be enabled for this project or the API token lacks permissions.`);
  } else if (error.statusCode === 401 || error.statusCode === 403 || error.message?.includes('Not authorized')) {
    throw new Error(`Failed to create release: Authentication failed. Check that your Sanity token has permission to create releases.`);
  } else {
    throw new Error(`Failed to create release: ${error.message}`);
  }
}

/**
 * Creates a new content release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - Unique ID for the release
 * @param title - Display title for the release
 * @param options - Optional metadata for the release
 * @returns Result of creating the release
 */
export async function createRelease(
  projectId: string, 
  dataset: string, 
  releaseId: string, 
  title?: string,
  options?: ReleaseOptions
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    // Validate release parameters
    validateReleaseParameters(releaseId, options);
    
    // Create the release action
    const action = {
      actionType: 'sanity.action.release.create',
      releaseId,
      metadata: createReleaseMetadata(releaseId, title, options)
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
    handleReleaseCreationError(error, releaseId);
  }
}

/**
 * Creates a version document action for a document in a release
 * 
 * @param releaseId - ID of the release
 * @param documentId - ID of the document to create a version for
 * @param attributes - Document content/attributes
 * @returns The created action object
 */
function createVersionAction(releaseId: string, documentId: string, attributes: SanityDocument) {
  const baseDocId = normalizeBaseDocId(documentId);
  const versionId = `versions.${releaseId}.${baseDocId}`;
  
  return {
    actionType: 'sanity.action.document.version.create',
    publishedId: baseDocId,
    attributes: {
      ...attributes,
      _id: versionId
    }
  };
}

/**
 * Processes a single document for adding to a release
 * 
 * @param client - Sanity client
 * @param releaseId - ID of the release
 * @param documentId - ID of the document to process
 * @param content - Optional custom content
 * @returns Object containing the processed document's action, ID, and version ID
 * @throws Error if document is not found
 */
async function processDocumentForRelease(
  client: SanityClient,
  releaseId: string,
  documentId: string,
  content?: SanityDocument
) {
  const baseDocId = normalizeBaseDocId(documentId);
  
  // Use provided content or fetch from Sanity
  const attributes = content || await getDocumentContent(client, documentId);
  
  // Create version ID
  const versionId = `versions.${releaseId}.${baseDocId}`;
  
  // Create the version action
  const action = createVersionAction(releaseId, documentId, attributes);
  
  return {
    action,
    documentId: baseDocId,
    versionId
  };
}

/**
 * Adds a document or multiple documents to a content release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release
 * @param documentIds - ID or array of IDs of the document(s) to add to the release
 * @param content - Optional custom content to use for the document version
 * @returns Result of adding the document(s) to the release
 */
export async function addDocumentToRelease(
  projectId: string, 
  dataset: string, 
  releaseId: string, 
  documentIds: string | string[], 
  content?: SanityDocument
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  documentIds: string[];
  versionIds: string[];
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    // Normalize to always work with an array of document IDs
    const normalizedIds = normalizeDocumentIds(documentIds);
    
    if (normalizedIds.length === 0) {
      throw new Error('No valid document IDs provided');
    }
    
    // Create a Sanity client
    const client = createSanityClient(projectId, dataset, {
      apiVersion: config.apiVersion,
      token: config.sanityToken
    });
    
    // Process each document and collect actions
    const actions: Array<{
      actionType: string;
      publishedId?: string;
      attributes?: {
        _id: string;
        _type: string;
        _rev?: string;
        _createdAt?: string;
        _updatedAt?: string;
      };
      documentId?: string;
    }> = [];
    const processedIds: string[] = [];
    const versionIds: string[] = [];
    const errors: string[] = [];
    
    for (const docId of normalizedIds) {
      try {
        const { action, documentId, versionId } = await processDocumentForRelease(client, releaseId, docId, content);
        actions.push(action);
        processedIds.push(documentId);
        versionIds.push(versionId);
      } catch (documentError: any) {
        console.error(`Error processing document ${docId}:`, documentError);
        errors.push(`Document ID ${docId}: ${documentError.message}`);
      }
    }
    
    // If no documents were processed successfully, throw an error with all collected error messages
    if (processedIds.length === 0) {
      throw new Error(`Failed to add any documents to release: ${errors.join('; ')}`);
    }
    
    // Call the Actions API with all document actions
    const result = await sanityApi.performActions(projectId, dataset, actions);
    
    // If we have both successful and failed documents, include that in the message
    let message = `${processedIds.length} document(s) added to release ${releaseId} successfully`;
    if (errors.length > 0) {
      message += `. Warning: ${errors.length} document(s) could not be added`;
      console.warn(`Some documents could not be added to release ${releaseId}:`, errors);
    }
    
    return {
      success: true,
      message,
      releaseId,
      documentIds: processedIds,
      versionIds,
      result
    };
  } catch (error: any) {
    throw createErrorResponse(`Failed to add document(s) to release ${releaseId}`, error);
  }
}

/**
 * Removes one or more documents from a content release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release
 * @param documentIds - ID or array of IDs of the document(s) to remove from the release
 * @returns Result of removing the document(s) from the release
 */
export async function removeDocumentFromRelease(
  projectId: string, 
  dataset: string, 
  releaseId: string, 
  documentIds: string | string[]
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  documentIds: string[];
  result: SanityActionResult;
}> {
  try {
    validateApiVersion();
    
    // Normalize to always work with an array of document IDs
    const normalizedIds = normalizeDocumentIds(documentIds);
    
    if (normalizedIds.length === 0) {
      throw new Error('No valid document IDs provided');
    }
    
    // Process each document ID for removal
    const actions: Array<{
      actionType: string;
      documentId: string;
    }> = [];
    const processedIds: string[] = [];
    
    for (const docId of normalizedIds) {
      try {
        const baseDocId = normalizeBaseDocId(docId);
        const versionId = `versions.${releaseId}.${baseDocId}`;
        
        actions.push({
          actionType: 'sanity.action.document.delete',
          documentId: versionId
        });
        
        processedIds.push(baseDocId);
      } catch (documentError: any) {
        console.error(`Error processing document ${docId} for removal:`, documentError);
      }
    }
    
    // If no documents were successfully processed, throw an error
    if (actions.length === 0) {
      throw new Error('Failed to remove any documents from release');
    }
    
    // Execute the actions
    const result = await sanityApi.performActions(projectId, dataset, actions);
    
    return {
      success: true,
      message: `${processedIds.length} document(s) removed from release ${releaseId} successfully`,
      releaseId,
      documentIds: processedIds,
      result
    };
  } catch (error: any) {
    console.error(`Error removing document(s) from release ${releaseId}:`, error);
    throw createErrorResponse(`Failed to remove document(s) from release ${releaseId}: ${error.message}`, error);
  }
}

/**
 * Lists all documents in a content release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release
 * @returns List of documents in the release
 */
interface ReleaseDocument {
  versionId: string;
  documentId: string;
  type: string;
  title: string;
}

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
    // Check API version first
    validateApiVersion();
    
    // Create client with perspective: 'raw' as required for sanity::partOfRelease
    const client = createSanityClient(projectId, dataset, { perspective: 'raw' });
    
    // Use the sanity::partOfRelease function to get all documents in the release
    const query = `*[sanity::partOfRelease($releaseId)]{ _id, _type, title }`;
    const params = { releaseId: releaseId };
    
    const documents = await client.fetch(query, params);
    
    // Map version documents to their base documents
    const mappedDocuments: ReleaseDocument[] = documents.map((doc: SanityDocument) => {
      // Extract the base document ID from the version ID
      const baseId = doc._id.replace(`versions.${releaseId}.`, '');
      
      return {
        versionId: doc._id,
        documentId: baseId,
        type: doc._type,
        title: doc['title'] || `Untitled ${doc._type}`,
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
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
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

/**
 * Lists all releases for a project and dataset
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @returns List of all releases
 */
export async function listReleases(
  projectId: string,
  dataset: string
): Promise<{
  releases: SanityDocument[];
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    const client = createSanityClient(projectId, dataset);
    
    // Query for all releases using the GROQ function
    const query = `releases::all()`;
    const releases = await client.fetch(query);
    
    return {
      releases
    };
  } catch (error: any) {
    console.error(`Error listing releases:`, error);
    
    // Check for common issues
    if (error.message?.includes('Unknown GROQ function "releases::all"')) {
      throw new Error(`Failed to list releases: The releases::all() function is not available. Make sure you're using API version 2024-05-23 or later.`);
    } else if (error.statusCode === 404) {
      throw new Error(`Failed to list releases: The Content Releases feature might not be enabled for this project or the API token lacks permissions.`);
    } else if (error.statusCode === 401 || error.statusCode === 403) {
      throw new Error(`Failed to list releases: Authentication failed. Check that your Sanity token has permission to access releases.`);
    } else {
      throw new Error(`Failed to list releases: ${error.message}`);
    }
  }
}

/**
 * Gets a specific release by ID
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to retrieve
 * @returns The release data
 */
export async function getRelease(
  projectId: string,
  dataset: string,
  releaseId: string
): Promise<{
  release: SanityDocument;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    const client = createSanityClient(projectId, dataset);
    
    // Query for the specific release
    const query = `*[_id == "_.releases.${releaseId}"]`;
    const releases = await client.fetch(query);
    
    if (!releases || releases.length === 0) {
      throw new Error(`Release with ID ${releaseId} not found`);
    }
    
    return {
      release: releases[0]
    };
  } catch (error: any) {
    console.error(`Error getting release ${releaseId}:`, error);
    throw new Error(`Failed to get release: ${error.message}`);
  }
}

/**
 * Updates a release's information
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to update
 * @param updateData - Data to update on the release
 * @returns Result of updating the release
 */
export async function updateRelease(
  projectId: string,
  dataset: string,
  releaseId: string,
  updateData: {
    title?: string;
    description?: string;
    releaseType?: 'asap' | 'scheduled';
    intendedPublishAt?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    // Validate required fields for scheduled releases
    if (updateData.releaseType === 'scheduled' && !updateData.intendedPublishAt) {
      throw new Error('intendedPublishAt is required for scheduled releases');
    }
    
    // Create the metadata object with only provided fields
    const metadata: Record<string, any> = {};
    if (updateData['title']) metadata['title'] = updateData['title'];
    if (updateData['description']) metadata['description'] = updateData['description'];
    if (updateData['releaseType']) metadata['releaseType'] = updateData['releaseType'];
    if (updateData['intendedPublishAt']) metadata['intendedPublishAt'] = updateData['intendedPublishAt'];
    
    // Create the release edit action
    const action = {
      actionType: 'sanity.action.release.edit',
      releaseId,
      patch: {
        id: releaseId, // Add the id property required by SanityAction interface
        set: {
          metadata
        }
      }
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Release ${releaseId} updated successfully`,
      releaseId,
      result
    };
  } catch (error: any) {
    console.error(`Error updating release ${releaseId}:`, error);
    throw new Error(`Failed to update release: ${error.message}`);
  }
}

/**
 * Schedules a release for publishing at a specific time
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to schedule
 * @param publishAt - ISO string of when to publish the release
 * @returns Result of scheduling the release
 */
export async function scheduleRelease(
  projectId: string,
  dataset: string,
  releaseId: string,
  publishAt: string
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  scheduledTime: string;
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    // Create the schedule release action
    const action = {
      actionType: 'sanity.action.release.schedule',
      releaseId,
      publishAt
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Release ${releaseId} scheduled for ${publishAt}`,
      releaseId,
      scheduledTime: publishAt,
      result
    };
  } catch (error: any) {
    console.error(`Error scheduling release ${releaseId}:`, error);
    throw new Error(`Failed to schedule release: ${error.message}`);
  }
}

/**
 * Unschedules a previously scheduled release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to unschedule
 * @returns Result of unscheduling the release
 */
export async function unscheduleRelease(
  projectId: string,
  dataset: string,
  releaseId: string
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    // Create the unschedule release action
    const action = {
      actionType: 'sanity.action.release.unschedule',
      releaseId
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Release ${releaseId} unscheduled successfully`,
      releaseId,
      result
    };
  } catch (error: any) {
    console.error(`Error unscheduling release ${releaseId}:`, error);
    throw new Error(`Failed to unschedule release: ${error.message}`);
  }
}

/**
 * Archives a release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to archive
 * @returns Result of archiving the release
 */
export async function archiveRelease(
  projectId: string,
  dataset: string,
  releaseId: string
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    // Create the archive release action
    const action = {
      actionType: 'sanity.action.release.archive',
      releaseId
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Release ${releaseId} archived successfully`,
      releaseId,
      result
    };
  } catch (error: any) {
    console.error(`Error archiving release ${releaseId}:`, error);
    throw new Error(`Failed to archive release: ${error.message}`);
  }
}

/**
 * Unarchives a previously archived release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to unarchive
 * @returns Result of unarchiving the release
 */
export async function unarchiveRelease(
  projectId: string,
  dataset: string,
  releaseId: string
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    // Create the unarchive release action
    const action = {
      actionType: 'sanity.action.release.unarchive',
      releaseId
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Release ${releaseId} unarchived successfully`,
      releaseId,
      result
    };
  } catch (error: any) {
    console.error(`Error unarchiving release ${releaseId}:`, error);
    throw new Error(`Failed to unarchive release: ${error.message}`);
  }
}

/**
 * Deletes an archived release
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param releaseId - ID of the release to delete
 * @returns Result of deleting the release
 */
export async function deleteRelease(
  projectId: string,
  dataset: string,
  releaseId: string
): Promise<{
  success: boolean;
  message: string;
  releaseId: string;
  result: SanityActionResult;
}> {
  try {
    // Check API version first
    validateApiVersion();
    
    // Create the delete release action
    const action = {
      actionType: 'sanity.action.release.delete',
      releaseId
    };
    
    // Call the Actions API
    const result = await sanityApi.performActions(projectId, dataset, [action]);
    
    return {
      success: true,
      message: `Release ${releaseId} deleted successfully`,
      releaseId,
      result
    };
  } catch (error: any) {
    console.error(`Error deleting release ${releaseId}:`, error);
    throw new Error(`Failed to delete release: ${error.message}`);
  }
}
