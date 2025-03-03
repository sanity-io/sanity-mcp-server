import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import * as releasesController from '../../src/controllers/releases.js';
import { sanityApi, createSanityClient } from '../../src/utils/sanityClient.js';

// Mock the sanityClient module
vi.mock('../../src/utils/sanityClient.js', () => {
  return {
    sanityApi: {
      performActions: vi.fn()
    },
    createSanityClient: vi.fn(() => ({
      fetch: vi.fn(),
      getDocument: vi.fn()
    }))
  };
});

describe('Releases Controller', () => {
  const mockProjectId = 'test-project';
  const mockDataset = 'test-dataset';
  const mockReleaseId = 'test-release-123';
  const mockDocumentId = 'test-doc-123';
  const mockClient = { fetch: vi.fn(), getDocument: vi.fn() };
  
  beforeEach(() => {
    vi.resetAllMocks();
    (createSanityClient as any).mockReturnValue(mockClient);
    
    // Setup mock document behavior
    mockClient.getDocument.mockImplementation((id: string) => {
      if (id === mockDocumentId || id === `drafts.${mockDocumentId}`) {
        return Promise.resolve({
          _id: id,
          _type: 'article',
          title: 'Test Document'
        });
      }
      return Promise.reject(new Error(`Document ${id} not found`));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createRelease', () => {
    it('should create a release with title', async () => {
      const mockTitle = 'Test Release';
      const mockResult = { transactionId: 'tx123' };
      
      (sanityApi.performActions as any).mockResolvedValueOnce(mockResult);

      const result = await releasesController.createRelease(
        mockProjectId,
        mockDataset,
        mockReleaseId,
        mockTitle
      );

      expect(sanityApi.performActions).toHaveBeenCalledWith(
        mockProjectId,
        mockDataset,
        [
          {
            actionType: 'sanity.action.release.create',
            releaseId: mockReleaseId,
            metadata: {
              title: mockTitle
            }
          }
        ]
      );

      expect(result).toEqual({
        success: true,
        message: `Release ${mockReleaseId} created successfully`,
        releaseId: mockReleaseId,
        result: mockResult
      });
    });

    it('should create a release with title and options', async () => {
      const mockTitle = 'Test Release';
      const mockOptions = {
        description: 'Test description',
        releaseType: 'scheduled' as const,
        intendedPublishAt: '2025-04-01T12:00:00Z'
      };
      const mockResult = { transactionId: 'tx123' };
      
      (sanityApi.performActions as any).mockResolvedValueOnce(mockResult);

      const result = await releasesController.createRelease(
        mockProjectId,
        mockDataset,
        mockReleaseId,
        mockTitle,
        mockOptions
      );

      expect(sanityApi.performActions).toHaveBeenCalledWith(
        mockProjectId,
        mockDataset,
        [
          {
            actionType: 'sanity.action.release.create',
            releaseId: mockReleaseId,
            metadata: {
              title: mockTitle,
              description: mockOptions.description,
              releaseType: mockOptions.releaseType,
              intendedPublishAt: mockOptions.intendedPublishAt
            }
          }
        ]
      );

      expect(result).toEqual({
        success: true,
        message: `Release ${mockReleaseId} created successfully`,
        releaseId: mockReleaseId,
        result: mockResult
      });
    });

    it('should handle errors when creating a release', async () => {
      const mockTitle = 'Test Release';
      const mockError = new Error('Test error');
      
      (sanityApi.performActions as any).mockRejectedValueOnce(mockError);

      await expect(
        releasesController.createRelease(mockProjectId, mockDataset, mockReleaseId, mockTitle)
      ).rejects.toThrow('Failed to create release: Test error');

      expect(sanityApi.performActions).toHaveBeenCalled();
    });
  });

  describe('addDocumentToRelease', () => {
    it('should add a document to a release when content is provided', async () => {
      const mockContent = { _id: mockDocumentId, title: 'Test Doc', _type: 'article' };
      const mockResult = { transactionId: 'tx123' };
      
      (sanityApi.performActions as any).mockResolvedValueOnce(mockResult);

      const result = await releasesController.addDocumentToRelease(
        mockProjectId,
        mockDataset,
        mockReleaseId,
        mockDocumentId,
        mockContent
      );

      expect(sanityApi.performActions).toHaveBeenCalledWith(
        mockProjectId,
        mockDataset,
        [
          {
            actionType: 'sanity.action.document.version.create',
            publishedId: mockDocumentId,
            attributes: {
              ...mockContent,
              _id: `versions.${mockReleaseId}.${mockDocumentId}`
            }
          }
        ]
      );

      expect(result).toEqual({
        success: true,
        message: `Document ${mockDocumentId} added to release ${mockReleaseId} successfully`,
        releaseId: mockReleaseId,
        documentId: mockDocumentId,
        versionId: `versions.${mockReleaseId}.${mockDocumentId}`,
        result: mockResult
      });
    });

    it('should fetch document content when not provided', async () => {
      const mockDoc = { _id: mockDocumentId, title: 'Test Doc', _type: 'article' };
      const mockResult = { transactionId: 'tx123' };
      
      mockClient.getDocument.mockResolvedValueOnce(mockDoc);
      (sanityApi.performActions as any).mockResolvedValueOnce(mockResult);

      const result = await releasesController.addDocumentToRelease(
        mockProjectId,
        mockDataset,
        mockReleaseId,
        mockDocumentId
      );

      expect(mockClient.getDocument).toHaveBeenCalledWith(mockDocumentId);
      expect(sanityApi.performActions).toHaveBeenCalledWith(
        mockProjectId,
        mockDataset,
        [
          {
            actionType: 'sanity.action.document.version.create',
            publishedId: mockDocumentId,
            attributes: {
              ...mockDoc,
              _id: `versions.${mockReleaseId}.${mockDocumentId}`
            }
          }
        ]
      );

      expect(result.success).toBe(true);
      expect(result.documentId).toBe(mockDocumentId);
    });
  });

  describe('listReleaseDocuments', () => {
    it('should list all documents in a release', async () => {
      const mockDocs = [
        { _id: `versions.${mockReleaseId}.doc1`, _type: 'post', title: 'Post 1' },
        { _id: `versions.${mockReleaseId}.doc2`, _type: 'post', title: 'Post 2' }
      ];
      
      mockClient.fetch.mockResolvedValueOnce(mockDocs);

      const result = await releasesController.listReleaseDocuments(
        mockProjectId,
        mockDataset,
        mockReleaseId
      );

      expect(mockClient.fetch).toHaveBeenCalledWith(`*[_id match "versions.${mockReleaseId}.*"]{ _id, _type, title }`);
      expect(result).toEqual({
        releaseId: mockReleaseId,
        documentCount: 2,
        documents: [
          {
            versionId: 'versions.test-release-123.doc1',
            documentId: 'doc1',
            type: 'post',
            title: 'Post 1'
          },
          {
            versionId: 'versions.test-release-123.doc2',
            documentId: 'doc2',
            type: 'post',
            title: 'Post 2'
          }
        ]
      });
    });
    
    it('should handle empty releases', async () => {
      mockClient.fetch.mockResolvedValueOnce([]);
      
      const result = await releasesController.listReleaseDocuments(
        mockProjectId,
        mockDataset,
        mockReleaseId
      );
      
      expect(result).toEqual({
        releaseId: mockReleaseId,
        documentCount: 0,
        documents: []
      });
    });
  });

  describe('publishRelease', () => {
    it('should publish a release', async () => {
      const mockDocs = [
        { _id: `versions.${mockReleaseId}.doc1`, _type: 'post', title: 'Post 1' }
      ];
      const mockResult = { transactionId: 'tx123' };
      
      mockClient.fetch.mockResolvedValueOnce(mockDocs);
      (sanityApi.performActions as any).mockResolvedValueOnce(mockResult);

      const result = await releasesController.publishRelease(
        mockProjectId,
        mockDataset,
        mockReleaseId
      );

      expect(sanityApi.performActions).toHaveBeenCalledWith(
        mockProjectId,
        mockDataset,
        [
          {
            actionType: 'sanity.action.release.publish',
            releaseId: mockReleaseId
          }
        ]
      );

      expect(result).toEqual({
        success: true,
        message: `Release ${mockReleaseId} published successfully`,
        releaseId: mockReleaseId,
        documentCount: 1,
        result: mockResult
      });
    });

    it('should throw error if release has too many documents', async () => {
      // Generate 51 mock documents to exceed the 50 document limit
      const mockDocs = Array.from({ length: 51 }).map((_, i) => ({
        _id: `versions.${mockReleaseId}.doc${i}`,
        _type: 'post',
        title: `Post ${i}`
      }));
      
      mockClient.fetch.mockResolvedValueOnce(mockDocs);

      await expect(
        releasesController.publishRelease(mockProjectId, mockDataset, mockReleaseId)
      ).rejects.toThrow(/Release contains 51 documents, which exceeds the 50 document limit/);

      expect(sanityApi.performActions).not.toHaveBeenCalled();
    });
  });

  describe('listReleases', () => {
    it('should list all releases', async () => {
      const mockReleases = [
        { _id: '_.releases.rel1', name: 'rel1', state: 'active' },
        { _id: '_.releases.rel2', name: 'rel2', state: 'published' }
      ];
      
      mockClient.fetch.mockResolvedValueOnce(mockReleases);

      const result = await releasesController.listReleases(
        mockProjectId,
        mockDataset
      );

      expect(mockClient.fetch).toHaveBeenCalledWith('releases::all()');
      expect(result).toEqual({
        releases: mockReleases
      });
    });
  });

  describe('updateRelease', () => {
    it('should update a release with provided fields', async () => {
      const mockUpdate = {
        title: 'Updated Title',
        description: 'Updated description'
      };
      const mockResult = { transactionId: 'tx123' };
      
      (sanityApi.performActions as any).mockResolvedValueOnce(mockResult);

      const result = await releasesController.updateRelease(
        mockProjectId,
        mockDataset,
        mockReleaseId,
        mockUpdate
      );

      expect(sanityApi.performActions).toHaveBeenCalledWith(
        mockProjectId,
        mockDataset,
        [
          {
            actionType: 'sanity.action.release.edit',
            releaseId: mockReleaseId,
            patch: {
              id: mockReleaseId,
              set: {
                metadata: {
                  title: 'Updated Title',
                  description: 'Updated description'
                }
              }
            }
          }
        ]
      );

      expect(result.success).toBe(true);
    });
  });

  // Additional test cases for other methods can be added as needed
});
