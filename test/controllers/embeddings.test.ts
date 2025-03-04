import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listEmbeddingsIndices, semanticSearch } from '../../src/controllers/embeddings.js';
import config from '../../src/config/config.js';

// Mock fetch
global.fetch = vi.fn();

// Mock the client
vi.mock('@sanity/client', () => ({
  createClient: vi.fn()
}));

// Mock config
vi.mock('../../src/config/config.js', () => ({
  default: {
    projectId: 'test-project',
    dataset: 'test-dataset',
    apiVersion: '2023-01-01',
    sanityToken: 'test-token',
    openAiApiKey: 'test-openai-key'
  }
}));

describe('Embeddings Controller', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Setup fetch mock for embeddings API
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          name: 'test-index',
          status: 'ready',
          documentCount: 100,
          dimensions: 1536,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ])
    });
  });
  
  describe('listEmbeddingsIndices', () => {
    it('should list embeddings indices for a dataset', async () => {
      const mockResponseJson = [
        {
          name: 'test-index',
          status: 'ready',
          documentCount: 100,
          dimensions: 1536,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ];
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponseJson)
      });

      const indices = await listEmbeddingsIndices({
        projectId: 'test-project',
        dataset: 'test-dataset'
      });
      
      expect(indices).toBeDefined();
      expect(Array.isArray(indices)).toBe(true);
      expect(indices).toHaveLength(1);
      expect(indices[0].name).toBe('test-index');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-project.api.sanity.io/vX/embeddings-index/test-dataset',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });
    
    it('should throw error with missing projectId and dataset', async () => {
      await expect(listEmbeddingsIndices({
        projectId: '',
        dataset: ''
      })).rejects.toThrow('Project ID and Dataset name are required');
    });
    
    it('should throw error with no sanity token', async () => {
      // Temporarily remove token
      const originalConfig = { ...config };
      Object.assign(config, { sanityToken: '' });
      
      await expect(listEmbeddingsIndices({
        projectId: 'test-project',
        dataset: 'test-dataset'
      })).rejects.toThrow('SANITY_TOKEN is missing');
      
      // Restore token
      Object.assign(config, originalConfig);
    });
    
    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue('Unauthorized')
      });
      
      await expect(listEmbeddingsIndices({
        projectId: 'test-project',
        dataset: 'test-dataset'
      })).rejects.toThrow('Authentication failed');
    });
  });
  
  describe('semanticSearch', () => {
    beforeEach(() => {
      // Setup fetch mock for semanticSearch API
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            _id: 'doc1',
            title: 'Test Document 1',
            _score: 0.95
          },
          {
            _id: 'doc2',
            title: 'Test Document 2',
            _score: 0.85
          }
        ])
      });
    });
    
    it('should search content using query', async () => {
      const result = await semanticSearch('test query', {
        indexName: 'test-index',
        maxResults: 10,
        types: ['article'],
        projectId: 'test-project',
        dataset: 'test-dataset'
      });
      
      expect(result.hits).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hits[0]._id).toBe('doc1');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-project.api.sanity.io/vX/embeddings-index/query/test-dataset/test-index',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test query')
        })
      );
    });
    
    it('should handle errors when searching content', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: vi.fn().mockResolvedValue('Not Found')
      });
      
      await expect(semanticSearch('test query', {
        indexName: 'nonexistent-index',
        projectId: 'test-project',
        dataset: 'test-dataset'
      })).rejects.toThrow('Embeddings index "nonexistent-index" not found');
    });
    
    it('should require project ID and dataset', async () => {
      await expect(semanticSearch('test query', {
        projectId: '',
        dataset: '',
        indexName: 'test-index'
      })).rejects.toThrow('Project ID and Dataset name are required');
    });
    
    it('should require an index name', async () => {
      await expect(semanticSearch('test query', {
        indexName: '',
        projectId: 'test-project',
        dataset: 'test-dataset'
      })).rejects.toThrow('indexName parameter is required for semantic search');
    });
  });
});
