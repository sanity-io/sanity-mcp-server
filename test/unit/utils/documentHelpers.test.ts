import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeDraftId,
  normalizeBaseDocId,
  applyPatchOperations,
  getDocumentContent,
  createErrorResponse,
  normalizeDocumentIds
} from '../../../src/utils/documentHelpers.js';

describe('Document Helpers', () => {
  describe('normalizeDraftId', () => {
    it('should add drafts. prefix to document ID if not present', () => {
      expect(normalizeDraftId('doc123')).toBe('drafts.doc123');
    });

    it('should not modify document ID if drafts. prefix is already present', () => {
      expect(normalizeDraftId('drafts.doc123')).toBe('drafts.doc123');
    });
  });

  describe('normalizeBaseDocId', () => {
    it('should remove drafts. prefix from document ID if present', () => {
      expect(normalizeBaseDocId('drafts.doc123')).toBe('doc123');
    });

    it('should not modify document ID if drafts. prefix is not present', () => {
      expect(normalizeBaseDocId('doc123')).toBe('doc123');
    });
  });

  describe('applyPatchOperations', () => {
    let patchObj: any;

    beforeEach(() => {
      patchObj = {
        set: vi.fn(),
        setIfMissing: vi.fn(),
        unset: vi.fn(),
        inc: vi.fn(),
        dec: vi.fn(),
        insert: vi.fn(),
        diffMatchPatch: vi.fn()
      };
    });

    it('should apply set operation', () => {
      const patch = { set: { title: 'New Title' } };
      applyPatchOperations(patch, patchObj);
      expect(patchObj.set).toHaveBeenCalledWith({ title: 'New Title' });
    });

    it('should apply setIfMissing operation', () => {
      const patch = { setIfMissing: { author: 'Unknown' } };
      applyPatchOperations(patch, patchObj);
      expect(patchObj.setIfMissing).toHaveBeenCalledWith({ author: 'Unknown' });
    });

    it('should apply unset operation', () => {
      const patch = { unset: ['comments'] };
      applyPatchOperations(patch, patchObj);
      expect(patchObj.unset).toHaveBeenCalledWith(['comments']);
    });

    it('should apply inc operation', () => {
      const patch = { inc: { views: 1 } };
      applyPatchOperations(patch, patchObj);
      expect(patchObj.inc).toHaveBeenCalledWith({ views: 1 });
    });

    it('should apply dec operation', () => {
      const patch = { dec: { stock: 1 } };
      applyPatchOperations(patch, patchObj);
      expect(patchObj.dec).toHaveBeenCalledWith({ stock: 1 });
    });

    it('should apply insert operation', () => {
      const patch = { 
        insert: { 
          items: ['item1', 'item2'], 
          position: 'after' as const, 
          at: 'tags[-1]' 
        } 
      };
      applyPatchOperations(patch, patchObj);
      expect(patchObj.insert).toHaveBeenCalledWith('after', 'tags[-1]', ['item1', 'item2']);
    });

    it('should apply diffMatchPatch operation', () => {
      const patch = { diffMatchPatch: { description: '@@ -1,5 +1,9 @@' } };
      applyPatchOperations(patch, patchObj);
      expect(patchObj.diffMatchPatch).toHaveBeenCalledWith({ description: '@@ -1,5 +1,9 @@' });
    });

    it('should apply multiple operations', () => {
      const patch = {
        set: { title: 'New Title' },
        unset: ['oldField'],
        inc: { views: 1 }
      };
      // Mock all the necessary methods to ensure they exist before applying operations
      const mockPatchObj = {
        set: vi.fn().mockReturnThis(),
        setIfMissing: vi.fn().mockReturnThis(),
        unset: vi.fn().mockReturnThis(),
        inc: vi.fn().mockReturnThis(),
        dec: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        diffMatchPatch: vi.fn().mockReturnThis(),
        ifRevisionId: vi.fn().mockReturnThis()
      };
      
      applyPatchOperations(patch, mockPatchObj);
      expect(mockPatchObj.set).toHaveBeenCalledWith({ title: 'New Title' });
      expect(mockPatchObj.unset).toHaveBeenCalledWith(['oldField']);
      expect(mockPatchObj.inc).toHaveBeenCalledWith({ views: 1 });
    });
  });

  describe('getDocumentContent', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        getDocument: vi.fn()
      };
    });

    it('should return draft document if it exists', async () => {
      const draftDoc = { _id: 'drafts.doc123', title: 'Draft Title' };
      mockClient.getDocument.mockImplementation((id) => {
        return id === 'drafts.doc123' ? draftDoc : null;
      });
      
      const result = await getDocumentContent(mockClient, 'doc123');
      
      expect(result).toEqual(draftDoc);
      expect(mockClient.getDocument).toHaveBeenCalledWith('drafts.doc123');
    });

    it('should return published document if draft does not exist', async () => {
      const publishedDoc = { _id: 'doc123', title: 'Published Title' };
      mockClient.getDocument.mockImplementation((id) => {
        return id === 'doc123' ? publishedDoc : null;
      });
      
      const result = await getDocumentContent(mockClient, 'doc123');
      
      expect(result).toEqual(publishedDoc);
      expect(mockClient.getDocument).toHaveBeenCalledWith('drafts.doc123');
      expect(mockClient.getDocument).toHaveBeenCalledWith('doc123');
    });

    it('should return fallback content if document does not exist', async () => {
      const fallbackContent = { _id: 'doc123', title: 'Fallback Title', _type: 'document' };
      mockClient.getDocument.mockResolvedValue(null);
      
      const result = await getDocumentContent(mockClient, 'doc123', fallbackContent);
      
      expect(result).toEqual(fallbackContent);
      expect(mockClient.getDocument).toHaveBeenCalledWith('drafts.doc123');
      expect(mockClient.getDocument).toHaveBeenCalledWith('doc123');
    });

    it('should throw error if document does not exist and no fallback is provided', async () => {
      mockClient.getDocument.mockResolvedValue(null);
      
      await expect(getDocumentContent(mockClient, 'doc123'))
        .rejects.toThrow('Document doc123 not found');
    });
  });

  describe('createErrorResponse', () => {
    it('should create a formatted error with message', () => {
      const originalError = new Error('Database connection failed');
      const result = createErrorResponse('Failed to update document', originalError);
      
      expect(result.message).toBe('Failed to update document: Database connection failed');
    });

    it('should log the error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalError = new Error('Not found');
      
      createErrorResponse('Document retrieval error', originalError);
      
      expect(consoleSpy).toHaveBeenCalledWith('Document retrieval error:', originalError);
      consoleSpy.mockRestore();
    });
  });

  describe('normalizeDocumentIds', () => {
    it('should handle single string ID', () => {
      expect(normalizeDocumentIds('doc123')).toEqual(['doc123']);
    });

    it('should handle array of IDs', () => {
      expect(normalizeDocumentIds(['doc123', 'doc456'])).toEqual(['doc123', 'doc456']);
    });

    it('should parse JSON string array', () => {
      expect(normalizeDocumentIds('["doc123", "doc456"]')).toEqual(['doc123', 'doc456']);
    });

    it('should treat invalid JSON as single ID', () => {
      expect(normalizeDocumentIds('[doc123, doc456]')).toEqual(['[doc123, doc456]']);
    });

    it('should handle JSON-like string that is not actually a proper array', () => {
      expect(normalizeDocumentIds('["single"]')).toEqual(['single']);
    });

    it('should throw error for empty array', () => {
      expect(() => normalizeDocumentIds([])).toThrow('No document IDs provided');
    });

    it('should convert non-string to string', () => {
      // @ts-expect-error - Testing with invalid type
      expect(normalizeDocumentIds(123)).toEqual(['123']);
    });
  });
});
