import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getToolDefinitions } from '../../src/controllers/tools.js';
import * as mutateController from '../../src/controllers/mutate.js';

// Mock the mutate controller
vi.mock('../../src/controllers/mutate.js');

describe('Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Get all tools and find the mutateDocument tool
  const tools = getToolDefinitions();
  const mutateDocumentTool = tools.find(tool => tool.name === 'mutateDocument');

  describe('mutateDocument', () => {
    it('should exist', () => {
      expect(mutateDocumentTool).toBeDefined();
    });

    it('should handle create mutation', async () => {
      if (!mutateDocumentTool) return;

      // Mock the modifyDocuments function
      vi.mocked(mutateController.modifyDocuments).mockResolvedValueOnce({
        success: true,
        message: 'Successfully applied 1 mutations',
        documentIds: ['doc123']
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
        documentIds: ['doc123']
      });
    });

    it('should handle createOrReplace mutation', async () => {
      if (!mutateDocumentTool) return;

      vi.mocked(mutateController.modifyDocuments).mockResolvedValueOnce({
        success: true,
        message: 'Successfully applied 1 mutations',
        documentIds: ['doc123']
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
        documentIds: ['doc123']
      });
    });

    it('should handle patch mutation', async () => {
      if (!mutateDocumentTool) return;

      vi.mocked(mutateController.modifyDocuments).mockResolvedValueOnce({
        success: true,
        message: 'Successfully applied 1 mutations',
        documentIds: ['doc123']
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
        documentIds: ['doc123']
      });
    });

    it('should handle multiple mutation operations', async () => {
      if (!mutateDocumentTool) return;

      vi.mocked(mutateController.modifyDocuments).mockResolvedValueOnce({
        success: true,
        message: 'Successfully applied 2 mutations',
        documentIds: ['doc123']
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
        documentIds: ['doc123']
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
