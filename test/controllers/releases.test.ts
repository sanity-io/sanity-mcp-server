import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import * as releasesController from '../../src/controllers/releases.js';
import { sanityApi, createSanityClient } from '../../src/utils/sanityClient.js';
import config from '../../src/config/config.js';

// Mock the sanityClient module
vi.mock('../../src/utils/sanityClient.js', () => {
  return {
    sanityApi: {
      performActions: vi.fn()
    },
    createSanityClient: vi.fn((_projectId, _dataset, _options = {}) => ({
      fetch: vi.fn(),
      getDocument: vi.fn(),
      query: vi.fn()
    })),
    isSufficientApiVersion: vi.fn().mockReturnValue(true)
  };
});

// Mock the config module to return a valid API version
vi.mock('../../src/config/config.js', () => {
  return {
    default: {
      apiVersion: '2025-02-19',
      token: 'mock-token',
      projectId: 'mock-project',
      dataset: 'production'
    }
  }
});

describe('Releases Controller', () => {
  const mockProjectId = 'test-project';
  const mockDataset = 'test-dataset';
  const mockReleaseId = 'test-release-123';
  const mockDocumentId = 'test-doc-123';
  const mockClient = { fetch: vi.fn(), getDocument: vi.fn(), query: vi.fn() };
  
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
        message: `1 document(s) added to release ${mockReleaseId} successfully`,
        releaseId: mockReleaseId,
        documentIds: [mockDocumentId],
        versionIds: [`versions.${mockReleaseId}.${mockDocumentId}`],
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
      expect(result.documentIds).toContain(mockDocumentId);
      expect(result.documentIds.length).toBe(1);
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

      expect(mockClient.fetch).toHaveBeenCalledWith(
        `*[sanity::partOfRelease($releaseId)]{ _id, _type, title }`,
        { releaseId: mockReleaseId }
      );
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
      
      expect(mockClient.fetch).toHaveBeenCalledWith(
        `*[sanity::partOfRelease($releaseId)]{ _id, _type, title }`,
        { releaseId: mockReleaseId }
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

  describe('removeDocumentFromRelease', () => {
    it('should remove a document from a release', async () => {
      const mockResult = { transactionId: 'tx123' };
      
      (sanityApi.performActions as any).mockResolvedValueOnce(mockResult);

      const result = await releasesController.removeDocumentFromRelease(
        mockProjectId,
        mockDataset,
        mockReleaseId,
        mockDocumentId
      );

      expect(sanityApi.performActions).toHaveBeenCalledWith(
        mockProjectId,
        mockDataset,
        [
          {
            actionType: 'sanity.action.document.delete',
            id: `versions.${mockReleaseId}.${mockDocumentId}`
          }
        ]
      );

      expect(result).toEqual({
        success: true,
        message: `Document ${mockDocumentId} removed from release ${mockReleaseId} successfully`,
        releaseId: mockReleaseId,
        documentId: mockDocumentId,
        result: mockResult
      });
    });

    it('should handle errors when removing a document from a release', async () => {
      const mockError = new Error('Version deletion failed');
      
      (sanityApi.performActions as any).mockRejectedValueOnce(mockError);

      await expect(
        releasesController.removeDocumentFromRelease(
          mockProjectId,
          mockDataset,
          mockReleaseId,
          mockDocumentId
        )
      ).rejects.toThrow('Version deletion failed');
    });
  });

  describe('getRelease', () => {
    it('should get a release by ID', async () => {
      const mockReleaseData = {
        _id: `_.releases.${mockReleaseId}`,
        title: 'Test Release',
        status: 'active'
      };
      
      mockClient.fetch.mockResolvedValueOnce([mockReleaseData]);

      const result = await releasesController.getRelease(
        mockProjectId,
        mockDataset,
        mockReleaseId
      );

      expect(mockClient.fetch).toHaveBeenCalledWith(
        `*[_id == "_.releases.${mockReleaseId}"]`
      );

      expect(result).toEqual({
        release: mockReleaseData
      });
    });

    it('should throw an error when release is not found', async () => {
      mockClient.fetch.mockResolvedValueOnce([]);

      await expect(
        releasesController.getRelease(
          mockProjectId,
          mockDataset,
          mockReleaseId
        )
      ).rejects.toThrow('Failed to get release: Release with ID');
    });
  });
});
