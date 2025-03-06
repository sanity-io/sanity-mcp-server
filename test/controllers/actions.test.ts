import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSanityClient, sanityApi } from '../../src/utils/sanityClient.js';
import { 
  publishDocument, 
  unpublishDocument
} from '../../src/controllers/actions.js';

// Mock the sanityClient and its API
vi.mock('../../src/utils/sanityClient.js', () => ({
  createSanityClient: vi.fn(),
  sanityApi: {
    performActions: vi.fn()
  }
}));

describe('Actions Controller', () => {
  // Mock client and its methods
  const mockClient = {
    getDocument: vi.fn(),
    fetch: vi.fn()
  };
  
  // Mock API responses
  const mockPerformActionsResponse = {
    transactionId: 'trans123',
    results: [{ id: 'result1', success: true }]
  };
  
  beforeEach(() => {
    // Setup mocks
    (createSanityClient as any).mockReturnValue(mockClient);
    (sanityApi.performActions as any).mockResolvedValue(mockPerformActionsResponse);
    
    // Reset document fetch behavior
    mockClient.getDocument.mockImplementation((id: string) => {
      if (id === 'doc123' || id === 'drafts.doc123') {
        return Promise.resolve({
          _id: id,
          _type: 'article',
          title: 'Test Document'
        });
      }
      return Promise.reject(new Error('Document not found'));
    });
    
    // Clear mock call history
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('publishDocument', () => {
    it('should publish a draft document', async () => {
      const result = await publishDocument('project123', 'dataset123', 'drafts.doc123');
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.publish',
          draftId: 'drafts.doc123',
          publishedId: 'doc123'
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        documentId: 'doc123'
      }));
    });
    
    it('should handle document IDs without drafts prefix', async () => {
      const result = await publishDocument('project123', 'dataset123', 'doc123');
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.publish',
          draftId: 'drafts.doc123',
          publishedId: 'doc123'
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        documentId: 'doc123'
      }));
    });
    
    it('should throw an error when publishing fails', async () => {
      (sanityApi.performActions as any).mockRejectedValueOnce(new Error('Failed to publish'));
      
      await expect(publishDocument('project123', 'dataset123', 'doc123')).rejects.toThrow('Failed to publish document');
    });
  });
  
  describe('unpublishDocument', () => {
    it('should unpublish a document', async () => {
      const result = await unpublishDocument('project123', 'dataset123', 'doc123');
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.unpublish',
          documentId: 'doc123'
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        draftId: 'drafts.doc123'
      }));
    });
    
    it('should handle document IDs with drafts prefix', async () => {
      const result = await unpublishDocument('project123', 'dataset123', 'drafts.doc123');
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.unpublish',
          documentId: 'doc123'
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        draftId: 'drafts.doc123'
      }));
    });
    
    it('should throw an error when unpublishing fails', async () => {
      (sanityApi.performActions as any).mockRejectedValueOnce(new Error('Failed to unpublish'));
      
      await expect(unpublishDocument('project123', 'dataset123', 'doc123')).rejects.toThrow('Failed to unpublish document');
    });
  });
});
