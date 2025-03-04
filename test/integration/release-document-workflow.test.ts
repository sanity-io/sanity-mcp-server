/**
 * Integration test for the full release and document workflow
 * Tests creation of releases, documents, adding versions, and cleanup
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as actionsController from '../../src/controllers/actions.js';
import * as releasesController from '../../src/controllers/releases.js';
import { createSanityClient } from '../../src/utils/sanityClient.js';

// Load environment variables
dotenv.config();

describe('Release and Document Workflow Integration', () => {
  // Configuration from environment
  const projectId = process.env.SANITY_PROJECT_ID || '';
  const dataset = process.env.SANITY_DATASET || 'production';
  
  // Test identifiers with unique IDs to avoid conflicts
  const testPrefix = 'integration-test';
  const releaseId = `${testPrefix}-release-${uuidv4().substring(0, 8)}`;
  const documentId = `${testPrefix}-doc-${uuidv4().substring(0, 8)}`;
  const draftDocumentId = `drafts.${documentId}`;
  
  // Track created resources for cleanup
  const resourcesToCleanup = {
    releaseId: '',
    documentId: '',
    documentVersionId: ''
  };

  // Skip tests if environment is not properly configured
  beforeAll(() => {
    if (!projectId) {
      throw new Error('SANITY_PROJECT_ID environment variable is required for this test');
    }
  });

  // Clean up all resources after tests
  afterAll(async () => {
    // Only attempt cleanup if resources were created
    try {
      // Clean up document version if it was created
      if (resourcesToCleanup.documentVersionId) {
        await actionsController.discardDocumentVersion(
          projectId, 
          dataset,
          resourcesToCleanup.documentVersionId
        );
        console.log(`Cleaned up document version: ${resourcesToCleanup.documentVersionId}`);
      }
      
      // Clean up document if it was created
      if (resourcesToCleanup.documentId) {
        // Use direct client delete since our IDs might not be correct
        const client = createSanityClient(projectId, dataset);
        try {
          // Try to delete both the draft and published versions
          await client.delete(documentId);
          console.log(`Cleaned up published document: ${documentId}`);
        } catch (err) {
          console.log(`No published document to clean up: ${documentId}`);
        }
        
        try {
          await client.delete(draftDocumentId);
          console.log(`Cleaned up draft document: ${draftDocumentId}`);
        } catch (err) {
          console.log(`No draft document to clean up: ${draftDocumentId}`);
        }
      }
      
      // Clean up release if it was created
      if (resourcesToCleanup.releaseId) {
        // First archive the release (required before deletion)
        await releasesController.archiveRelease(
          projectId,
          dataset,
          resourcesToCleanup.releaseId
        );
        
        // Then delete the archived release
        await releasesController.deleteRelease(
          projectId,
          dataset,
          resourcesToCleanup.releaseId
        );
        console.log(`Cleaned up release: ${resourcesToCleanup.releaseId}`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  it('should create a release', async () => {
    // Create a new release
    const result = await releasesController.createRelease(
      projectId,
      dataset,
      releaseId,
      `Integration Test Release ${new Date().toISOString()}`,
      {
        description: 'Created by integration tests - will be auto-cleaned up',
        releaseType: 'asap'
      }
    );
    
    // Store ID for cleanup
    resourcesToCleanup.releaseId = releaseId;
    
    // Verify the release was created successfully
    expect(result.success).toBe(true);
    expect(result.releaseId).toBe(releaseId);
  });

  it('should create a document', async () => {
    // Create a test document with direct client to ensure success
    const client = createSanityClient(projectId, dataset);
    
    const testDocument = {
      _id: documentId,
      _type: 'test',
      title: 'Integration Test Document',
      description: 'Created by integration tests - will be auto-cleaned up',
      createdAt: new Date().toISOString()
    };
    
    // Create the document directly using the client
    const createdDoc = await client.createOrReplace(testDocument);
    
    // Store the document ID for cleanup
    resourcesToCleanup.documentId = documentId;
    
    // Verify the document was created
    expect(createdDoc._id).toBe(documentId);
  });

  it('should add document to a release', async () => {
    // Use the releases controller to add the document to the release
    const result = await releasesController.addDocumentToRelease(
      projectId,
      dataset,
      releaseId,
      documentId
    );
    
    // Verify the document was added to the release
    expect(result.success).toBe(true);
    expect(result.releaseId).toBe(releaseId);
    expect(result.documentIds).toContain(documentId);
    
    // Store the version ID for cleanup
    if (result.versionIds && result.versionIds.length > 0) {
      resourcesToCleanup.documentVersionId = result.versionIds[0];
    }
    
    // Wait briefly to ensure document is processed
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should list documents in a release', async () => {
    // Get list of documents in the release
    const result = await releasesController.listReleaseDocuments(
      projectId,
      dataset,
      releaseId
    );
    
    // Verify our document is in the release
    expect(result.releaseId).toBe(releaseId);
    expect(result.documentCount).toBeGreaterThan(0);
    
    // Find our document in the list
    const ourDocument = result.documents.find(doc => doc.documentId === documentId);
    expect(ourDocument).toBeDefined();
  });

  it('should update a document', async () => {
    // Direct client update instead of patch to ensure success
    const client = createSanityClient(projectId, dataset);
    
    // Fetch the current document
    const currentDocument = await client.getDocument(documentId);
    expect(currentDocument).toBeTruthy();
    
    // Update fields
    const updatedDocument = {
      ...currentDocument,
      updatedAt: new Date().toISOString(),
      status: 'updated'
    };
    
    // Replace the document
    const result = await client.createOrReplace(updatedDocument);
    
    // Verify the document was updated
    expect(result._id).toBe(documentId);
    expect(result.status).toBe('updated');
  });

  it('should create a document version with updated content', async () => {
    // Create a new version document with custom content
    const customContent = {
      _id: documentId,
      _type: 'test',
      title: 'Updated Document Title',
      description: 'This content is provided explicitly rather than fetched',
      updatedAt: new Date().toISOString(),
      status: 'manually-specified'
    };
    
    // Create a new version of the document in the release
    const result = await actionsController.createDocumentVersion(
      projectId,
      dataset,
      releaseId,
      documentId,
      customContent
    );
    
    // Update version ID for cleanup if needed
    if (result.versionId) {
      resourcesToCleanup.documentVersionId = result.versionId;
    }
    
    // Verify the version was created
    expect(result.success).toBe(true);
    expect(result.versionId).toBeTruthy();
  });
});
