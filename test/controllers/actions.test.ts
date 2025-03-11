import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  createDocument,
  deleteDocument,
  publishDocument,
  unpublishDocument} from '../../src/controllers/actions.js'
import {createSanityClient, sanityApi} from '../../src/utils/sanityClient.js'

// Mock the sanityClient and its API
vi.mock('../../src/utils/sanityClient.js', () => ({
  createSanityClient: vi.fn(),
  sanityApi: {
    performActions: vi.fn()
  }
}))

describe('Actions Controller', () => {
  // Mock client and its methods
  const mockClient = {
    getDocument: vi.fn(),
    fetch: vi.fn(),
    transaction: vi.fn(),
    create: vi.fn(),
    createIfNotExists: vi.fn(),
    createOrReplace: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn()
  }

  // Mock API responses
  const mockPerformActionsResponse = {
    transactionId: 'trans123',
    results: [{id: 'result1', success: true}]
  }

  // Mock transaction object
  const mockTransaction = {
    create: vi.fn().mockReturnThis(),
    createIfNotExists: vi.fn().mockReturnThis(),
    createOrReplace: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    commit: vi.fn()
  }

  beforeEach(() => {
    // Setup mocks
    (createSanityClient as any).mockReturnValue(mockClient);
    (sanityApi.performActions as any).mockResolvedValue(mockPerformActionsResponse)

    // Reset document fetch behavior
    mockClient.getDocument.mockImplementation((id: string) => {
      if (id.startsWith('drafts.')) {
        return Promise.resolve({_id: id, _type: 'document', title: 'Draft Document'})
      }
      return Promise.resolve(null)
    })

    // Setup transaction mock
    mockClient.transaction.mockReturnValue(mockTransaction)

    // Setup create mock
    mockClient.create.mockResolvedValue({_id: 'doc123', _type: 'document'})

    // Setup delete mock
    mockClient.delete.mockResolvedValue({_id: 'doc123', _type: 'document'})

    // Reset transaction commit behavior
    mockTransaction.commit.mockResolvedValue({
      transactionId: 'tx123',
      results: [{id: 'doc123', operation: 'create'}]
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('publishDocument', () => {
    it('should publish a draft document', async () => {
      const result = await publishDocument('project123', 'dataset123', 'drafts.doc123')

      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.publish',
          draftId: 'drafts.doc123',
          publishedId: 'doc123'
        })
      ])

      expect(result).toEqual(expect.objectContaining({
        success: true,
        documentId: 'doc123'
      }))
    })

    it('should handle document IDs without drafts prefix', async () => {
      const result = await publishDocument('project123', 'dataset123', 'doc123')

      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.publish',
          draftId: 'drafts.doc123',
          publishedId: 'doc123'
        })
      ])

      expect(result).toEqual(expect.objectContaining({
        success: true,
        documentId: 'doc123'
      }))
    })

    it('should throw an error when publishing fails', async () => {
      (sanityApi.performActions as any).mockRejectedValueOnce(new Error('Failed to publish'))

      await expect(publishDocument('project123', 'dataset123', 'doc123')).rejects.toThrow('Failed to publish document')
    })
  })

  describe('unpublishDocument', () => {
    it('should unpublish a document', async () => {
      const result = await unpublishDocument('project123', 'dataset123', 'doc123')

      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.unpublish',
          documentId: 'doc123'
        })
      ])

      expect(result).toEqual(expect.objectContaining({
        success: true,
        draftId: 'drafts.doc123'
      }))
    })

    it('should handle document IDs with drafts prefix', async () => {
      const result = await unpublishDocument('project123', 'dataset123', 'drafts.doc123')

      expect(sanityApi.performActions).toHaveBeenCalledWith('project123', 'dataset123', [
        expect.objectContaining({
          actionType: 'sanity.action.document.unpublish',
          documentId: 'doc123'
        })
      ])

      expect(result).toEqual(expect.objectContaining({
        success: true,
        draftId: 'drafts.doc123'
      }))
    })

    it('should throw an error when unpublishing fails', async () => {
      (sanityApi.performActions as any).mockRejectedValueOnce(new Error('Failed to unpublish'))

      await expect(unpublishDocument('project123', 'dataset123', 'doc123')).rejects.toThrow('Failed to unpublish document')
    })
  })

  describe('createDocument', () => {
    const singleDocument = {
      _type: 'post',
      title: 'Test Post',
      body: 'Test content'
    }

    const multipleDocuments = [
      {
        _type: 'post',
        title: 'Test Post 1',
        body: 'Test content 1'
      },
      {
        _type: 'post',
        title: 'Test Post 2',
        body: 'Test content 2'
      }
    ]

    it('should create a single document successfully', async () => {
      // Execute
      const result = await createDocument('project123', 'dataset123', singleDocument)

      // Verify
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123')
      expect(mockClient.create).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.documentId).toBeDefined()
      expect(result.message).toContain('Document created successfully')
    })

    it('should create multiple documents successfully', async () => {
      // Setup specific mock for this test
      mockTransaction.commit.mockResolvedValueOnce({
        transactionId: 'tx123',
        results: [
          {id: 'doc123', operation: 'create'},
          {id: 'doc124', operation: 'create'}
        ]
      })

      // Execute
      const result = await createDocument('project123', 'dataset123', multipleDocuments)

      // Verify
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123')
      expect(mockClient.transaction).toHaveBeenCalled()
      expect(mockTransaction.create).toHaveBeenCalledTimes(2)
      expect(mockTransaction.commit).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.documentIds).toBeDefined()
      expect(result.documentIds?.length).toBe(2)
      expect(result.message).toContain('2 documents created successfully')
    })

    it('should throw an error if empty array is provided', async () => {
      // Execute & Verify
      await expect(createDocument('project123', 'dataset123', [])).rejects.toThrow(
        'Empty array of documents provided'
      )
    })

    it('should handle errors when creating a document', async () => {
      // Setup specific mock for this test
      mockClient.create.mockRejectedValueOnce(new Error('Creation failed'))

      // Execute & Verify
      await expect(createDocument('project123', 'dataset123', singleDocument)).rejects.toThrow(
        'Failed to create document: Creation failed'
      )
    })
  })

  describe('deleteDocument', () => {
    it('should delete a single document successfully', async () => {
      // Setup
      mockTransaction.commit.mockResolvedValueOnce({
        transactionId: 'tx123',
        results: [
          {id: 'doc123', operation: 'delete'},
          {id: 'drafts.doc123', operation: 'delete'}
        ]
      })

      // Execute
      const result = await deleteDocument('project123', 'dataset123', 'doc123')

      // Verify
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123')
      expect(mockClient.transaction).toHaveBeenCalled()
      expect(mockTransaction.delete).toHaveBeenCalledTimes(2) // Base doc and draft
      expect(mockTransaction.commit).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.documentId).toBe('doc123')
      expect(result.message).toContain('Document doc123 deleted successfully')
    })

    it('should delete multiple documents successfully', async () => {
      // Setup
      const mockDeleteMultipleResults = {
        transactionId: 'tx123',
        results: [
          {id: 'doc123', operation: 'delete'},
          {id: 'drafts.doc123', operation: 'delete'},
          {id: 'doc124', operation: 'delete'},
          {id: 'drafts.doc124', operation: 'delete'}
        ]
      }

      mockTransaction.commit.mockResolvedValueOnce(mockDeleteMultipleResults)

      // Execute
      const result = await deleteDocument('project123', 'dataset123', ['doc123', 'doc124'])

      // Verify
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123')
      expect(mockClient.transaction).toHaveBeenCalled()
      expect(mockTransaction.delete).toHaveBeenCalled()
      expect(mockTransaction.commit).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.documentIds).toBeDefined()
      expect(result.documentIds?.length).toBe(2)
      expect(result.message).toContain('2 documents deleted successfully')
    })

    it('should include additional drafts when specified in options', async () => {
      // Setup
      mockTransaction.commit.mockResolvedValueOnce({
        transactionId: 'tx123',
        results: [
          {id: 'doc123', operation: 'delete'},
          {id: 'drafts.doc123', operation: 'delete'},
          {id: 'drafts.extraDraft', operation: 'delete'}
        ]
      })

      // Execute
      const result = await deleteDocument('project123', 'dataset123', 'doc123', {
        includeDrafts: ['drafts.extraDraft']
      })

      // Verify
      expect(mockTransaction.delete).toHaveBeenCalledWith('drafts.extraDraft')
      expect(result.success).toBe(true)
    })

    it('should use purge option when specified', async () => {
      // Setup
      mockTransaction.commit.mockResolvedValueOnce({
        transactionId: 'tx123',
        results: [{id: 'doc123', operation: 'delete'}]
      })

      // Execute
      await deleteDocument('project123', 'dataset123', 'doc123', {purge: true})

      // Verify
      expect(mockTransaction.commit).toHaveBeenCalledWith({visibility: 'async'})
    })

    it('should throw an error if empty array is provided', async () => {
      // Execute & Verify
      await expect(deleteDocument('project123', 'dataset123', [])).rejects.toThrow(
        'Empty array of document IDs provided'
      )
    })

    it('should handle errors when deleting a document', async () => {
      // Setup
      mockTransaction.commit.mockRejectedValueOnce(new Error('Deletion failed'))

      // Execute & Verify
      await expect(deleteDocument('project123', 'dataset123', 'doc123')).rejects.toThrow(
        'Failed to delete document: Deletion failed'
      )
    })
  })
})
