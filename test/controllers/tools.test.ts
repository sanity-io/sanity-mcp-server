import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getToolDefinitions } from '../../src/controllers/tools.js';
import * as mutateController from '../../src/controllers/mutate.js';
import * as groqController from '../../src/controllers/groq.js';
import * as actionsController from '../../src/controllers/actions.js';

// Mock the controllers
vi.mock('../../src/controllers/mutate.js');
vi.mock('../../src/controllers/groq.js');
vi.mock('../../src/controllers/actions.js');

describe('Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Get all tools
  const tools = getToolDefinitions();
  
  describe('getDocument', () => {
    // Find the getDocument tool
    const getDocumentTool = tools.find(tool => tool.name === 'getDocument');
    
    it('should exist', () => {
      expect(getDocumentTool).toBeDefined();
    });
    
    it('should fetch a single document by ID', async () => {
      if (!getDocumentTool) return;
      
      // Mock the searchContent function (which getDocument uses internally)
      vi.mocked(groqController.searchContent).mockResolvedValueOnce({ 
        _id: 'doc123', 
        _type: 'test',
        title: 'Test Document' 
      });
      
      const result = await getDocumentTool.handler({ 
        documentId: 'doc123', 
        projectId: 'project123', 
        dataset: 'dataset123' 
      });
      
      expect(groqController.searchContent).toHaveBeenCalledWith(
        'project123', 
        'dataset123', 
        '*[_id == $documentId][0]', 
        { documentId: 'doc123' }
      );
      
      expect(result).toEqual({
        _id: 'doc123',
        _type: 'test',
        title: 'Test Document'
      });
    });
    
    it('should fetch multiple documents by their IDs', async () => {
      if (!getDocumentTool) return;
      
      // Mock the searchContent function (which getDocument uses internally for arrays)
      vi.mocked(groqController.searchContent).mockResolvedValueOnce([
        { _id: 'doc123', _type: 'test', title: 'Test Document 1' },
        { _id: 'doc456', _type: 'test', title: 'Test Document 2' }
      ]);
      
      const result = await getDocumentTool.handler({ 
        documentId: ['doc123', 'doc456'], 
        projectId: 'project123', 
        dataset: 'dataset123' 
      });
      
      expect(groqController.searchContent).toHaveBeenCalledWith(
        'project123', 
        'dataset123', 
        '*[_id in $documentIds]', 
        { documentIds: ['doc123', 'doc456'] }
      );
      
      expect(result).toEqual([
        { _id: 'doc123', _type: 'test', title: 'Test Document 1' },
        { _id: 'doc456', _type: 'test', title: 'Test Document 2' }
      ]);
    });
    
    it('should handle errors properly', async () => {
      if (!getDocumentTool) return;
      
      // Mock the searchContent function to throw an error
      vi.mocked(groqController.searchContent).mockRejectedValueOnce(new Error('Failed to fetch document'));
      
      await expect(getDocumentTool.handler({ 
        documentId: 'doc123', 
        projectId: 'project123', 
        dataset: 'dataset123' 
      })).rejects.toThrow('Failed to fetch document');
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
