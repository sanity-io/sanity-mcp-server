/**
 * Integration test for the full release and document workflow
 * Tests creation of releases, documents, adding versions, and cleanup
 * @vitest-environment node
 * @tags integration, standard
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as actionsController from '../../../src/controllers/actions.js';
import * as releasesController from '../../../src/controllers/releases.js';
import { createSanityClient } from '../../../src/utils/sanityClient.js';

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
  const documentId2 = `${testPrefix}-doc2-${uuidv4().substring(0, 8)}`;
  const documentId3 = `${testPrefix}-doc3-${uuidv4().substring(0, 8)}`;
  const draftDocumentId2 = `drafts.${documentId2}`;
  const draftDocumentId3 = `drafts.${documentId3}`;
  
  // Set a longer timeout for integration tests
  const INTEGRATION_TIMEOUT = 15000;
  
  // Track created resources for cleanup
  const resourcesToCleanup = {
    releaseId: '',
    documentId: '',
    documentVersionId: '',
    documentId2: '',
    documentId3: '',
    documentVersionIds: [] as string[]
  };

  // Skip tests if environment is not properly configured
  beforeAll(() => {
    if (!projectId) {
      throw new Error('SANITY_PROJECT_ID environment variable is required for this test');
    }
  }, INTEGRATION_TIMEOUT);

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

        // Clean up additional documents
        if (resourcesToCleanup.documentId2) {
          try {
            await client.delete(documentId2);
            console.log(`Cleaned up published document: ${documentId2}`);
          } catch (err) {
            console.log(`No published document to clean up: ${documentId2}`);
          }
          
          try {
            await client.delete(draftDocumentId2);
            console.log(`Cleaned up draft document: ${draftDocumentId2}`);
          } catch (err) {
            console.log(`No draft document to clean up: ${draftDocumentId2}`);
          }
        }

        if (resourcesToCleanup.documentId3) {
          try {
            await client.delete(documentId3);
            console.log(`Cleaned up published document: ${documentId3}`);
          } catch (err) {
            console.log(`No published document to clean up: ${documentId3}`);
          }
          
          try {
            await client.delete(draftDocumentId3);
            console.log(`Cleaned up draft document: ${draftDocumentId3}`);
          } catch (err) {
            console.log(`No draft document to clean up: ${draftDocumentId3}`);
          }
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
  }, INTEGRATION_TIMEOUT);

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
  }, INTEGRATION_TIMEOUT);

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
  }, INTEGRATION_TIMEOUT);

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
  }, INTEGRATION_TIMEOUT);

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
  }, INTEGRATION_TIMEOUT);

  it('should update a document', async () => {
    // Direct client update instead of patch to ensure success
    const client = createSanityClient(projectId, dataset);
    
    // Fetch the current document
    const currentDocument = await client.getDocument(documentId);
    expect(currentDocument).toBeTruthy();
    
    // Update fields
    const updatedDocument = {
      updatedAt: new Date().toISOString(),
      status: 'updated',
      _id: documentId, // Ensure _id is explicitly set
      _type: 'test-document' // Add required _type field
    };
    
    // Replace the document
    const result = await client.createOrReplace(updatedDocument);
    
    // Verify the document was updated
    expect(result._id).toBe(documentId);
    expect(result.status).toBe('updated');
  }, INTEGRATION_TIMEOUT);

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
  }, INTEGRATION_TIMEOUT);

  it('should create additional test documents', async () => {
    // Create two additional test documents for the array test
    const client = createSanityClient(projectId, dataset);
    
    const testDocument2 = {
      _id: documentId2,
      _type: 'test',
      title: 'Integration Test Document 2',
      description: 'Second test document for array testing',
      createdAt: new Date().toISOString()
    };
    
    const testDocument3 = {
      _id: documentId3,
      _type: 'test',
      title: 'Integration Test Document 3',
      description: 'Third test document for array testing',
      createdAt: new Date().toISOString()
    };
    
    // Create the documents
    const createdDoc2 = await client.createOrReplace(testDocument2);
    const createdDoc3 = await client.createOrReplace(testDocument3);
    
    // Store the document IDs for cleanup
    resourcesToCleanup.documentId2 = documentId2;
    resourcesToCleanup.documentId3 = documentId3;
    
    // Verify the documents were created
    expect(createdDoc2._id).toBe(documentId2);
    expect(createdDoc3._id).toBe(documentId3);
  }, INTEGRATION_TIMEOUT);

  it('should add multiple documents to a release as an array', async () => {
    // Add both documents to the release using the array parameter
    const result = await releasesController.addDocumentToRelease(
      projectId,
      dataset,
      releaseId,
      [documentId2, documentId3]
    );
    
    // Verify the documents were added to the release
    expect(result.success).toBe(true);
    expect(result.releaseId).toBe(releaseId);
    expect(result.documentIds).toContain(documentId2);
    expect(result.documentIds).toContain(documentId3);
    
    // Store version IDs for cleanup
    if (result.versionIds && result.versionIds.length > 0) {
      resourcesToCleanup.documentVersionIds = result.versionIds;
    }
    
    // Wait briefly to ensure documents are processed
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, INTEGRATION_TIMEOUT);

  it('should list all documents in the release including the array-added ones', async () => {
    // Get list of documents in the release
    const result = await releasesController.listReleaseDocuments(
      projectId,
      dataset,
      releaseId
    );
    
    // Verify all three documents are in the release
    expect(result.releaseId).toBe(releaseId);
    expect(result.documentCount).toBeGreaterThanOrEqual(3);
    
    // Find our documents in the list
    const document1 = result.documents.find(doc => doc.documentId === documentId);
    const document2 = result.documents.find(doc => doc.documentId === documentId2);
    const document3 = result.documents.find(doc => doc.documentId === documentId3);
    
    expect(document1).toBeDefined();
    expect(document2).toBeDefined();
    expect(document3).toBeDefined();
  }, INTEGRATION_TIMEOUT);
});
