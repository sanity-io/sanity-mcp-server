import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSanityClient, sanityApi } from '../../src/utils/sanityClient.js';
import { 
  publishDocument, 
  unpublishDocument, 
  createRelease, 
  addDocumentToRelease,
  listReleaseDocuments,
  publishRelease
} from '../../src/controllers/actions.js';

// Mock the sanityClient and its API
vi.mock('../../src/utils/sanityClient.js');

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
    (sanityApi.performActions as any) = vi.fn().mockResolvedValue(mockPerformActionsResponse);
    
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
    
    // Reset release documents fetch behavior
    mockClient.fetch.mockResolvedValue([
      { _id: 'versions.release123.doc1', _type: 'article', title: 'Article 1' },
      { _id: 'versions.release123.doc2', _type: 'page', title: 'Page 1' }
    ]);
    
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
          draftId: 'drafts.doc123',
          publishedId: 'doc123'
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
          draftId: 'drafts.doc123',
          publishedId: 'doc123'
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
  
  describe('createRelease', () => {
    it('should create a new release', async () => {
      const result = await createRelease('project123', 'dataset123', 'release123', 'My Test Release');
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.release.create',
          releaseId: 'release123',
          metadata: {
            title: 'My Test Release'
          }
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        releaseId: 'release123'
      }));
    });
    
    it('should use releaseId as title if title is not provided', async () => {
      const result = await createRelease('project123', 'dataset123', 'release123');
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.release.create',
          releaseId: 'release123',
          metadata: {
            title: 'Release: release123'
          }
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        releaseId: 'release123'
      }));
    });
    
    it('should throw an error when release creation fails', async () => {
      (sanityApi.performActions as any).mockRejectedValueOnce(new Error('Failed to create release'));
      
      await expect(createRelease('project123', 'dataset123', 'release123')).rejects.toThrow('Failed to create release');
    });
  });
  
  describe('addDocumentToRelease', () => {
    it('should add a document to a release', async () => {
      const result = await addDocumentToRelease('project123', 'dataset123', 'release123', 'doc123');
      
      expect(mockClient.getDocument).toHaveBeenCalledWith('doc123');
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.version.create',
          publishedId: 'doc123',
          attributes: expect.objectContaining({
            _id: 'versions.release123.doc123',
            _type: 'article',
            title: 'Test Document'
          })
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        releaseId: 'release123',
        documentId: 'doc123',
        versionId: 'versions.release123.doc123'
      }));
    });
    
    it('should handle document IDs with drafts prefix', async () => {
      const result = await addDocumentToRelease('project123', 'dataset123', 'release123', 'drafts.doc123');
      
      expect(mockClient.getDocument).toHaveBeenCalledWith('doc123');
      
      expect(result).toEqual(expect.objectContaining({
        documentId: 'doc123',
        versionId: 'versions.release123.doc123'
      }));
    });
    
    it('should use provided content if available', async () => {
      const customContent = {
        _type: 'article',
        title: 'Custom Title',
        content: 'Custom content'
      };
      
      const result = await addDocumentToRelease('project123', 'dataset123', 'release123', 'doc123', customContent);
      
      expect(mockClient.getDocument).not.toHaveBeenCalled();
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          attributes: expect.objectContaining({
            _id: 'versions.release123.doc123',
            _type: 'article',
            title: 'Custom Title',
            content: 'Custom content'
          })
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should try draft document if published document not found', async () => {
      mockClient.getDocument.mockImplementationOnce(() => Promise.reject(new Error('Not found')));
      
      await addDocumentToRelease('project123', 'dataset123', 'release123', 'doc123');
      
      expect(mockClient.getDocument).toHaveBeenCalledWith('doc123');
      expect(mockClient.getDocument).toHaveBeenCalledWith('drafts.doc123');
    });
    
    it('should throw an error if document not found', async () => {
      mockClient.getDocument.mockRejectedValue(new Error('Document not found'));
      
      await expect(addDocumentToRelease('project123', 'dataset123', 'release123', 'missing-doc')).rejects.toThrow('Failed to add document to release');
    });
    
    it('should throw an error when API call fails', async () => {
      (sanityApi.performActions as any).mockRejectedValueOnce(new Error('API error'));
      
      await expect(addDocumentToRelease('project123', 'dataset123', 'release123', 'doc123')).rejects.toThrow('Failed to add document to release');
    });
  });
  
  describe('listReleaseDocuments', () => {
    it('should list all documents in a release', async () => {
      const result = await listReleaseDocuments('project123', 'dataset123', 'release123');
      
      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_id match "versions.release123.*"]')
      );
      
      expect(result).toEqual(expect.objectContaining({
        releaseId: 'release123',
        documentCount: 2,
        documents: [
          expect.objectContaining({
            versionId: 'versions.release123.doc1',
            documentId: 'doc1',
            type: 'article',
            title: 'Article 1'
          }),
          expect.objectContaining({
            versionId: 'versions.release123.doc2',
            documentId: 'doc2',
            type: 'page',
            title: 'Page 1'
          })
        ]
      }));
    });
    
    it('should handle empty releases', async () => {
      mockClient.fetch.mockResolvedValueOnce([]);
      
      const result = await listReleaseDocuments('project123', 'dataset123', 'empty-release');
      
      expect(result).toEqual(expect.objectContaining({
        releaseId: 'empty-release',
        documentCount: 0,
        documents: []
      }));
    });
    
    it('should throw an error when fetch fails', async () => {
      mockClient.fetch.mockRejectedValueOnce(new Error('Fetch failed'));
      
      await expect(listReleaseDocuments('project123', 'dataset123', 'release123')).rejects.toThrow('Failed to list release documents');
    });
  });
  
  describe('publishRelease', () => {
    it('should publish a release with documents', async () => {
      const result = await publishRelease('project123', 'dataset123', 'release123');
      
      expect(mockClient.fetch).toHaveBeenCalled();
      
      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.release.publish',
          releaseId: 'release123'
        })
      ]);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        releaseId: 'release123',
        documentCount: 2
      }));
    });
    
    it('should throw an error when release exceeds document limit', async () => {
      // Create an array with 51 items to exceed the 50 document limit
      const largeDocumentList = Array(51).fill(0).map((_, i) => ({ 
        _id: `versions.release123.doc${i}`, 
        _type: 'article', 
        title: `Article ${i}` 
      }));
      
      mockClient.fetch.mockResolvedValueOnce(largeDocumentList);
      
      await expect(publishRelease('project123', 'dataset123', 'release123')).rejects.toThrow('Failed to publish release: Release contains 51 documents, which exceeds the 50 document limit');
    });
    
    it('should throw an error when publishing fails', async () => {
      (sanityApi.performActions as any).mockRejectedValueOnce(new Error('Publishing failed'));
      
      await expect(publishRelease('project123', 'dataset123', 'release123')).rejects.toThrow('Failed to publish release');
    });
  });
});
