/**
 * Unit tests for search controller
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as searchController from '../../src/controllers/search.js';
import config from '../../src/config/config.js';

// Mock global fetch
global.fetch = vi.fn();

// Setup test config
const originalConfig = { ...config };
const mockConfig = {
  projectId: 'mock-project',
  dataset: 'mock-dataset',
  sanityToken: 'mock-token',
  apiVersion: 'v2023-10-01'
};

describe('Search Controller', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset mock counts
    vi.resetAllMocks();
    
    // Apply mock config
    Object.assign(config, mockConfig);
    
    // Setup default successful response
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({})
    });
  });
  
  // Restore original config after each test
  afterEach(() => {
    Object.assign(config, originalConfig);
  });
  
  // Tests for listEmbeddingsIndices
  describe('listEmbeddingsIndices', () => {
    it('should call correct API endpoint with proper auth headers', async () => {
      // Setup mock response
      const mockIndices = [
        { name: 'docs', description: 'Documentation index' },
        { name: 'products', description: 'Product catalog index' }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIndices)
      });
      
      // Call the function
      const result = await searchController.listEmbeddingsIndices();
      
      // Assertions
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'https://mock-project.api.sanity.io/v2023-10-01/embeddings-index/mock-dataset',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
      expect(result).toEqual(mockIndices);
    });
    
    it('should accept custom projectId and dataset from parameters', async () => {
      // Call with custom parameters
      await searchController.listEmbeddingsIndices({ 
        projectId: 'custom-project', 
        dataset: 'custom-dataset' 
      });
      
      // Verify custom parameters were used
      expect(fetch).toHaveBeenCalledWith(
        'https://custom-project.api.sanity.io/v2023-10-01/embeddings-index/custom-dataset',
        expect.anything()
      );
    });
    
    it('should throw an error if projectId is missing', async () => {
      // Clear projectId in config and environment
      const savedConfig = { ...config };
      config.projectId = null;
      process.env.SANITY_PROJECT_ID = '';
      
      // Verify error is thrown with appropriate message
      await expect(() => 
        searchController.listEmbeddingsIndices()
      ).rejects.toThrowError(/Project ID is required/);
      
      // Restore config
      Object.assign(config, savedConfig);
    });
    
    it('should throw an error if dataset is missing', async () => {
      // Clear dataset in config and environment
      const savedConfig = { ...config };
      config.dataset = null;
      process.env.SANITY_DATASET = '';
      
      // Verify error is thrown with appropriate message
      await expect(() => 
        searchController.listEmbeddingsIndices()
      ).rejects.toThrowError(/Dataset name is required/);
      
      // Restore config
      Object.assign(config, savedConfig);
    });
    
    it('should throw an error if token is missing', async () => {
      // Setup test with missing token
      Object.assign(config, { ...mockConfig, sanityToken: null });
      
      // Verify error is thrown with appropriate message
      await expect(searchController.listEmbeddingsIndices())
        .rejects
        .toThrow(/SANITY_TOKEN is missing/);
    });
    
    it('should handle API errors appropriately', async () => {
      // Setup mock error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized')
      });
      
      // Verify error is thrown with appropriate message
      await expect(searchController.listEmbeddingsIndices())
        .rejects
        .toThrow(/Authentication failed/);
    });
  });
  
  // Tests for semanticSearch
  describe('semanticSearch', () => {
    it('should call correct API endpoint with proper query parameters', async () => {
      // Setup mock response data
      const mockSearchResults = {
        hits: [
          { score: 0.95, document: { _id: 'doc1', title: 'Document 1' } },
          { score: 0.82, document: { _id: 'doc2', title: 'Document 2' } }
        ],
        total: 2
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSearchResults)
      });
      
      // Call the function
      const result = await searchController.semanticSearch('test query', { 
        indexName: 'test-index',
        maxResults: 5,
        types: ['article', 'guide']
      });
      
      // Assertions
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'https://mock-project.api.sanity.io/v2023-10-01/embeddings-index/query/mock-dataset/test-index',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            query: 'test query',
            limit: 5,
            filter: '_type in ["article","guide"]'
          })
        }
      );
      expect(result).toEqual(mockSearchResults);
    });
    
    it('should throw an error if query is missing', async () => {
      await expect(searchController.semanticSearch(null, { indexName: 'test-index' }))
        .rejects
        .toThrow(/Query parameter is required/);
    });
    
    it('should throw an error if indexName is missing', async () => {
      await expect(searchController.semanticSearch('test query', {}))
        .rejects
        .toThrow(/indexName parameter is required/);
    });
    
    it('should try fallback endpoint format if primary endpoint returns 404', async () => {
      // Setup mock responses - first request fails, fallback succeeds
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Not Found')
      }).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ hits: [], total: 0 })
      });
      
      // Call the function
      await searchController.semanticSearch('test query', { indexName: 'test-index' });
      
      // Verify both endpoints were tried
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch.mock.calls[0][0]).toContain('/embeddings-index/query/');
      expect(fetch.mock.calls[1][0]).toContain('/embeddings-index/');
    });
    
    it('should handle empty search results gracefully', async () => {
      // Setup mock empty response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      });
      
      // Call the function and verify result format
      const result = await searchController.semanticSearch('test query', { indexName: 'test-index' });
      expect(result).toEqual({ hits: [], total: 0 });
    });
  });
});
