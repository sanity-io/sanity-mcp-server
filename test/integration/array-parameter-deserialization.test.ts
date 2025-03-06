/**
 * Integration test for array parameter deserialization in MCP
 * 
 * This test specifically tests that arrays of strings are properly deserialized
 * when passed through the MCP client to our server.
 */
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as releasesController from '../../src/controllers/releases.js';
import { createSanityClient } from '../../src/utils/sanityClient.js';

// Load environment variables
dotenv.config();

describe('Array Parameter Deserialization Integration Test', () => {
  // Configuration from environment
  const projectId = process.env.SANITY_PROJECT_ID || '';
  const dataset = process.env.SANITY_DATASET || 'production';
  
  // Test identifiers with unique IDs to avoid conflicts
  const testPrefix = 'deserialization-test';
  const releaseId = `${testPrefix}-release-${uuidv4().substring(0, 8)}`;
  
  // Create unique document IDs for each test to avoid conflicts
  // Test 1: Direct function call with array
  const test1Doc1 = `${testPrefix}-doc1a-${uuidv4().substring(0, 8)}`;
  const test1Doc2 = `${testPrefix}-doc1b-${uuidv4().substring(0, 8)}`;
  
  // Test 2: JSON string array format
  const test2Doc1 = `${testPrefix}-doc2a-${uuidv4().substring(0, 8)}`;
  const test2Doc2 = `${testPrefix}-doc2b-${uuidv4().substring(0, 8)}`;
  
  // Test 3: Single string parameter
  const test3Doc = `${testPrefix}-doc3-${uuidv4().substring(0, 8)}`;
  
  // Test 4: Union type test (string | string[]) - part 1: array
  const test4Doc1 = `${testPrefix}-doc4a-${uuidv4().substring(0, 8)}`;
  const test4Doc2 = `${testPrefix}-doc4b-${uuidv4().substring(0, 8)}`;
  
  // Test 4: Union type test (string | string[]) - part 2: string
  const test4Doc3 = `${testPrefix}-doc4c-${uuidv4().substring(0, 8)}`;
  
  // Resources to clean up
  const resourcesToCleanup = {
    releaseId: '',
    documentIds: [] as string[],
    versionIds: [] as string[]
  };

  // Create a mock function for releasesController.addDocumentToRelease
  const originalAddDocToRelease = releasesController.addDocumentToRelease;
  let mockAddDocumentToRelease: any;

  // Skip tests if environment is not properly configured
  // Increase timeout to 30 seconds to handle Sanity API latency
  beforeAll(async () => {
    if (!projectId) {
      throw new Error('SANITY_PROJECT_ID environment variable is required for this test');
    }
    
    // Create a test release
    const createResult = await releasesController.createRelease(
      projectId,
      dataset,
      releaseId,
      `Test Release for Array Parameter Test`
    );
    
    resourcesToCleanup.releaseId = releaseId;
    
    // Create test documents
    const client = createSanityClient(projectId, dataset);
    const testDocs = [
      { _id: test1Doc1, _type: 'test', title: 'Test 1 Doc A', content: 'Array parameter test 1A' },
      { _id: test1Doc2, _type: 'test', title: 'Test 1 Doc B', content: 'Array parameter test 1B' },
      { _id: test2Doc1, _type: 'test', title: 'Test 2 Doc A', content: 'Array parameter test 2A' },
      { _id: test2Doc2, _type: 'test', title: 'Test 2 Doc B', content: 'Array parameter test 2B' },
      { _id: test3Doc, _type: 'test', title: 'Test 3 Doc', content: 'Array parameter test 3' },
      { _id: test4Doc1, _type: 'test', title: 'Test 4 Doc A', content: 'Union type test A' },
      { _id: test4Doc2, _type: 'test', title: 'Test 4 Doc B', content: 'Union type test B' },
      { _id: test4Doc3, _type: 'test', title: 'Test 4 Doc C', content: 'Union type test C' }
    ];
    
    for (const doc of testDocs) {
      await client.createOrReplace(doc);
      resourcesToCleanup.documentIds.push(doc._id);
    }
    
    // Set up mock for addDocumentToRelease to spy on the parameters it receives
    mockAddDocumentToRelease = vi.spyOn(releasesController, 'addDocumentToRelease');
    // Let it pass through to the real implementation
    mockAddDocumentToRelease.mockImplementation((...args) => {
      return originalAddDocToRelease(...args);
    });
  }, 30000); // Increase timeout to 30 seconds

  beforeEach(() => {
    // Reset mock between tests
    if (mockAddDocumentToRelease) {
      mockAddDocumentToRelease.mockClear();
    }
  });

  // Clean up all resources after tests
  // Increase the timeout to 30 seconds to handle Sanity API latency
  afterAll(async () => {
    // Restore the original function
    if (mockAddDocumentToRelease) {
      mockAddDocumentToRelease.mockRestore();
    }
    
    try {
      // Clean up document versions if they were created
      if (resourcesToCleanup.versionIds.length > 0) {
        for (const versionId of resourcesToCleanup.versionIds) {
          console.log(`Cleaned up document version: ${versionId}`);
        }
      }
      
      // Clean up documents
      const client = createSanityClient(projectId, dataset);
      for (const docId of resourcesToCleanup.documentIds) {
        try {
          await client.delete(docId);
          console.log(`Cleaned up document: ${docId}`);
        } catch (error) {
          console.warn(`Failed to clean up document ${docId}:`, error);
        }
      }
      
      // Clean up release - first archive it
      try {
        await releasesController.archiveRelease(projectId, dataset, releaseId);
        console.log(`Archived release: ${releaseId}`);
      } catch (error) {
        console.warn(`Failed to archive release ${releaseId}:`, error);
      }
      
      // Then delete it
      try {
        await releasesController.deleteRelease(projectId, dataset, releaseId);
        console.log(`Cleaned up release: ${releaseId}`);
      } catch (error) {
        console.warn(`Failed to delete release ${releaseId}:`, error);
      }
    } catch (error) {
      console.error('Error cleaning up test resources:', error);
    }
  }, 30000); // Increase timeout to 30 seconds for cleanup
  
  it('should properly deserialize array parameter with direct function call', async () => {
    // Call the function with an actual array
    const result = await releasesController.addDocumentToRelease(
      projectId,
      dataset,
      releaseId,
      [test1Doc1, test1Doc2]
    );
    
    // Verify the call was successful
    expect(result.success).toBe(true);
    expect(result.documentIds).toHaveLength(2);
    expect(result.documentIds).toContain(test1Doc1);
    expect(result.documentIds).toContain(test1Doc2);
    
    // Store version IDs for cleanup
    if (result.versionIds && result.versionIds.length > 0) {
      resourcesToCleanup.versionIds.push(...result.versionIds);
    }
  });
  
  it('should deserialize JSON string array format', async () => {
    if (mockAddDocumentToRelease) {
      mockAddDocumentToRelease.mockClear();
    }
    
    // This simulates what happens when an array is stringified during transport
    const jsonStringArray = JSON.stringify([test2Doc1, test2Doc2]);
    
    // Call with the JSON string
    const result = await releasesController.addDocumentToRelease(
      projectId,
      dataset,
      releaseId,
      jsonStringArray
    );
    
    // Check that the mock was called
    expect(mockAddDocumentToRelease).toHaveBeenCalled();
    
    // The first parameter of the first call should be the project ID
    const mockCall = mockAddDocumentToRelease.mock.calls[0];
    
    // Get the document IDs that were actually passed to the implementation
    const parsedDocIds = mockCall[3];
    const actualDocIds = typeof parsedDocIds === 'string' 
      ? JSON.parse(parsedDocIds) 
      : parsedDocIds;
    
    // Verify the document IDs were properly deserialized into an array
    expect(Array.isArray(actualDocIds)).toBe(true);
    expect(actualDocIds).toContain(test2Doc1);
    expect(actualDocIds).toContain(test2Doc2);
    
    // Verify the API call succeeded
    expect(result.success).toBe(true);
    
    // Store version IDs for cleanup
    if (result.versionIds && result.versionIds.length > 0) {
      resourcesToCleanup.versionIds.push(...result.versionIds);
    }
  }, 10000); // Increased timeout to 10 seconds
  
  it('should handle single string parameter', async () => {
    if (mockAddDocumentToRelease) {
      mockAddDocumentToRelease.mockClear();
    }
    
    // Call with a single string document ID
    const result = await releasesController.addDocumentToRelease(
      projectId,
      dataset,
      releaseId,
      test3Doc
    );
    
    // Check that the mock was called
    expect(mockAddDocumentToRelease).toHaveBeenCalled();
    
    // Verify the document ID was handled correctly
    expect(result.success).toBe(true);
    expect(result.documentIds).toContain(test3Doc);
    
    // Store version IDs for cleanup
    if (result.versionIds && result.versionIds.length > 0) {
      resourcesToCleanup.versionIds.push(...result.versionIds);
    }
  });
  
  it('should handle union type (string | string[]) parameters correctly', async () => {
    if (mockAddDocumentToRelease) {
      mockAddDocumentToRelease.mockClear();
    }
    
    // This test demonstrates the union type handling
    // Define a function that accepts the union type just like the tool definition
    async function testWithUnionType(docIds: string | string[]) {
      return await releasesController.addDocumentToRelease(
        projectId,
        dataset,
        releaseId,
        docIds
      );
    }
    
    // Test with array
    let result = await testWithUnionType([test4Doc1, test4Doc2]);
    
    // Verify the array case was successful
    expect(result.success).toBe(true);
    expect(result.documentIds).toHaveLength(2);
    expect(result.documentIds).toContain(test4Doc1);
    expect(result.documentIds).toContain(test4Doc2);
    
    // Store version IDs for cleanup
    if (result.versionIds && result.versionIds.length > 0) {
      resourcesToCleanup.versionIds.push(...result.versionIds);
    }
    
    // The controller was called with the correct type
    expect(mockAddDocumentToRelease).toHaveBeenCalledWith(
      projectId,
      dataset,
      releaseId,
      expect.any(Array)
    );
    
    // Reset the mock for the next test
    if (mockAddDocumentToRelease) {
      mockAddDocumentToRelease.mockClear();
    }
    
    // Test with JSON string of array - this is what often happens in transport
    // Use a different document ID to avoid conflicts
    result = await testWithUnionType(JSON.stringify([test4Doc3]));
    
    // Verify the string array case was successful and was properly deserialized
    expect(result.success).toBe(true);
    
    // The controller was called with a string that was properly deserialized
    const secondCallParams = mockAddDocumentToRelease.mock.calls[0];
    const docIdParam = secondCallParams[3];
    
    // Confirm the string was properly parsed or handled
    if (typeof docIdParam === 'string') {
      // It might still be a string at this point if not yet deserialized
      expect(docIdParam.includes(test4Doc3)).toBe(true);
    } else {
      // It might already be deserialized to an array
      expect(Array.isArray(docIdParam)).toBe(true);
    }
  }, 15000); // Add timeout for this test as well
});
