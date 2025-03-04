import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getToolDefinitions } from '../../src/controllers/tools.js';
import * as mutateController from '../../src/controllers/mutate.js';
import * as groqController from '../../src/controllers/groq.js';

// Mock the controllers
vi.mock('../../src/controllers/mutate.js');
vi.mock('../../src/controllers/groq.js');

describe('Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Get all tools
  const tools = getToolDefinitions();
  
  describe('getDocuments', () => {
    // Find the getDocuments tool
    const getDocumentsTool = tools.find(tool => tool.name === 'getDocuments');
    
    it('should exist', () => {
      expect(getDocumentsTool).toBeDefined();
    });
    
    it('should fetch multiple documents by their IDs', async () => {
      if (!getDocumentsTool) return;
      
      // Mock the searchContent function (which getDocuments uses internally)
      vi.mocked(groqController.searchContent).mockResolvedValueOnce({
        results: [
          { _id: 'doc1', title: 'Document 1' },
          { _id: 'doc2', title: 'Document 2' }
        ]
      });
      
      const result = await getDocumentsTool.handler({
        documentIds: ['doc1', 'doc2'],
        projectId: 'project123',
        dataset: 'dataset123'
      });
      
      // Verify that searchContent was called with the correct parameters
      expect(groqController.searchContent).toHaveBeenCalledWith(
        'project123',
        'dataset123',
        '*[_id in $documentIds]',
        { documentIds: ['doc1', 'doc2'] }
      );
      
      // Verify the results
      expect(result).toEqual({
        results: [
          { _id: 'doc1', title: 'Document 1' },
          { _id: 'doc2', title: 'Document 2' }
        ]
      });
    });
    
    it('should handle errors properly', async () => {
      if (!getDocumentsTool) return;
      
      // Mock error response
      vi.mocked(groqController.searchContent).mockRejectedValueOnce(
        new Error('Failed to fetch documents')
      );
      
      // Assert that the error is properly propagated
      await expect(getDocumentsTool.handler({
        documentIds: ['doc1', 'doc2'],
        projectId: 'project123',
        dataset: 'dataset123'
      })).rejects.toThrow('Failed to fetch documents');
      
      expect(groqController.searchContent).toHaveBeenCalled();
    });
  });

  describe('mutateDocument', () => {
    const mutateDocumentTool = tools.find(tool => tool.name === 'mutateDocument');

    it('should exist', () => {
      expect(mutateDocumentTool).toBeDefined();
    });

    it('should handle create mutation', async () => {
      if (!mutateDocumentTool) return;

      // Mock the modifyDocuments function
      vi.mocked(mutateController.modifyDocuments).mockResolvedValueOnce({
        success: true,
        message: 'Successfully applied 1 mutations',
        documents: ['doc123']
      });

      const result = await mutateDocumentTool.handler({
        documentId: 'doc123',
        mutations: {
          create: {
            _type: 'article',
            title: 'New Article',
            body: 'Article content'
          }
        },
        projectId: 'project123',
        dataset: 'dataset123',
        returnDocument: true
      });

      expect(mutateController.modifyDocuments).toHaveBeenCalledWith(
        'project123',
        'dataset123',
        [{ create: { _id: 'doc123', _type: 'article', title: 'New Article', body: 'Article content' } }],
        true
      );
      
      expect(result).toEqual({
        success: true,
        message: 'Successfully applied 1 mutations',
        documents: ['doc123']
      });
    });

    it('should handle createOrReplace mutation', async () => {
      if (!mutateDocumentTool) return;

      vi.mocked(mutateController.modifyDocuments).mockResolvedValueOnce({
        success: true,
        message: 'Successfully applied 1 mutations',
        documents: ['doc123']
      });

      const result = await mutateDocumentTool.handler({
        documentId: 'doc123',
        mutations: {
          createOrReplace: {
            _type: 'article',
            title: 'Replaced Article',
            body: 'Updated content'
          }
        },
        projectId: 'project123',
        dataset: 'dataset123',
        returnDocument: true
      });

      expect(mutateController.modifyDocuments).toHaveBeenCalledWith(
        'project123',
        'dataset123',
        [{ createOrReplace: { _id: 'doc123', _type: 'article', title: 'Replaced Article', body: 'Updated content' } }],
        true
      );
      
      expect(result).toEqual({
        success: true,
        message: 'Successfully applied 1 mutations',
        documents: ['doc123']
      });
    });

    it('should handle patch mutation', async () => {
      if (!mutateDocumentTool) return;

      vi.mocked(mutateController.modifyDocuments).mockResolvedValueOnce({
        success: true,
        message: 'Successfully applied 1 mutations',
        documents: ['doc123']
      });

      const result = await mutateDocumentTool.handler({
        documentId: 'doc123',
        mutations: {
          patch: {
            set: { title: 'Updated Title' },
            unset: ['oldField'],
            inc: { viewCount: 1 }
          }
        },
        projectId: 'project123',
        dataset: 'dataset123',
        returnDocument: false
      });

      expect(mutateController.modifyDocuments).toHaveBeenCalledWith(
        'project123',
        'dataset123',
        [{ 
          patch: { 
            id: 'doc123', 
            set: { title: 'Updated Title' },
            unset: ['oldField'],
            inc: { viewCount: 1 }
          } 
        }],
        false
      );
      
      expect(result).toEqual({
        success: true,
        message: 'Successfully applied 1 mutations',
        documents: ['doc123']
      });
    });

    it('should handle multiple mutation operations', async () => {
      if (!mutateDocumentTool) return;

      vi.mocked(mutateController.modifyDocuments).mockResolvedValueOnce({
        success: true,
        message: 'Successfully applied 2 mutations',
        documents: ['doc123']
      });

      const result = await mutateDocumentTool.handler({
        documentId: 'doc123',
        mutations: {
          createOrReplace: {
            _type: 'article',
            title: 'New Article',
            body: 'Article content'
          },
          patch: {
            set: { publishedAt: new Date().toISOString() }
          }
        },
        projectId: 'project123',
        dataset: 'dataset123',
        returnDocument: true
      });

      expect(mutateController.modifyDocuments).toHaveBeenCalledWith(
        'project123',
        'dataset123',
        [
          { createOrReplace: { _id: 'doc123', _type: 'article', title: 'New Article', body: 'Article content' } },
          { patch: { id: 'doc123', set: expect.objectContaining({ publishedAt: expect.any(String) }) } }
        ],
        true
      );
      
      expect(result).toEqual({
        success: true,
        message: 'Successfully applied 2 mutations',
        documents: ['doc123']
      });
    });

    it('should handle errors properly', async () => {
      if (!mutateDocumentTool) return;

      vi.mocked(mutateController.modifyDocuments).mockRejectedValueOnce(new Error('Mutation failed'));

      await expect(mutateDocumentTool.handler({
        documentId: 'doc123',
        mutations: {
          patch: {
            set: { title: 'Updated Title' }
          }
        },
        projectId: 'project123',
        dataset: 'dataset123'
      })).rejects.toThrow('Mutation failed');

      expect(mutateController.modifyDocuments).toHaveBeenCalled();
    });
  });
});
