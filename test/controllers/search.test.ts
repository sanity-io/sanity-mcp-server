/**
 * Unit tests for search controller
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as searchController from '../../src/controllers/search.js';
import config from '../../src/config/config.js';
import { EmbeddingIndex, SearchResponse } from '../../src/types/index.js';

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch as unknown as typeof fetch;

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
    globalFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({})
    } as unknown as Response);
  });
  
  // Restore original config after each test
  afterEach(() => {
    Object.assign(config, originalConfig);
  });
  
  // Tests for listEmbeddingsIndices
  describe('listEmbeddingsIndices', () => {
    it('should call correct API endpoint with proper auth headers', async () => {
      // Setup mock response
      const mockIndices: EmbeddingIndex[] = [
        { 
          indexName: 'docs',
          status: 'active',
          projectId: 'mock-project',
          dataset: 'mock-dataset',
          projection: '_id',
          filter: '',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          failedDocumentCount: 0,
          startDocumentCount: 100,
          remainingDocumentCount: 0,
          webhookId: 'webhook-id'
        },
        { 
          indexName: 'products',
          status: 'active',
          projectId: 'mock-project',
          dataset: 'mock-dataset',
          projection: '_id',
          filter: '',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          failedDocumentCount: 0,
          startDocumentCount: 50,
          remainingDocumentCount: 0,
          webhookId: 'webhook-id'
        }
      ];
      
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIndices)
      } as unknown as Response);
      
      // Execute function
      const result = await searchController.listEmbeddingsIndices({
        projectId: 'mock-project',
        dataset: 'mock-dataset'
      });
      
      // Assertions
      expect(fetch).toHaveBeenCalledWith(
        'https://mock-project.api.sanity.io/vX/embeddings-index/mock-dataset',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
      
      // Verify result
      expect(result).toEqual(mockIndices);
    });
    
    it('should throw an error when API call fails', async () => {
      // Setup mock error response
      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized')
      } as unknown as Response);
      
      // Execute and expect error
      await expect(
        searchController.listEmbeddingsIndices({
          projectId: 'mock-project',
          dataset: 'mock-dataset'
        })
      ).rejects.toThrow('Authentication failed');
    });
    
    it('should require projectId and dataset', async () => {
      // Test missing projectId
      await expect(
        searchController.listEmbeddingsIndices({ dataset: 'mock-dataset', projectId: '' })
      ).rejects.toThrow('Project ID is required');
      
      // Test missing dataset
      await expect(
        searchController.listEmbeddingsIndices({ projectId: 'mock-project', dataset: '' })
      ).rejects.toThrow('Dataset name is required');
    });
  });
  
  // Tests for semanticSearch
  describe('semanticSearch', () => {
    it('should call correct API endpoint with proper query parameters', async () => {
      // Setup mock response data
      const mockSearchResults = [
        {
          score: 0.95,
          value: {
            documentId: 'doc123',
            type: 'article',
            title: 'Test Article'
          }
        },
        {
          score: 0.85,
          value: {
            documentId: 'doc456',
            type: 'article',
            title: 'Another Article'
          }
        }
      ];
      
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSearchResults)
      } as unknown as Response);
      
      // Execute function
      const result = await searchController.semanticSearch(
        'test query',
        {
          indexName: 'docs',
          maxResults: 10,
          types: ['article'],
          projectId: 'mock-project',
          dataset: 'mock-dataset'
        }
      );
      
      // Assertions for request
      expect(fetch).toHaveBeenCalledWith(
        'https://mock-project.api.sanity.io/vX/embeddings-index/query/mock-dataset/docs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            query: 'test query',
            limit: 10,
            filter: '_type in ["article"]'
          })
        }
      );
      
      // Verify result structure
      expect(result).toEqual({
        hits: mockSearchResults,
        total: mockSearchResults.length
      });
    });
    
    it('should throw an error when required parameters are missing', async () => {
      // Test missing query
      await expect(
        searchController.semanticSearch('', { indexName: 'docs' })
      ).rejects.toThrow('Query parameter is required');
      
      // Test missing indexName
      await expect(
        searchController.semanticSearch('test query', { indexName: '' } as any)
      ).rejects.toThrow('indexName parameter is required');
    });
    
    it('should throw an error when API call fails', async () => {
      // Setup mock error response
      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Index not found')
      } as unknown as Response);
      
      // Execute and expect error
      await expect(
        searchController.semanticSearch('test query', {
          indexName: 'non-existent-index',
          projectId: 'mock-project',
          dataset: 'mock-dataset'
        })
      ).rejects.toThrow('Embeddings index "non-existent-index" not found');
    });
  });
});
