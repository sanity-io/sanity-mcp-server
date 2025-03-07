import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSanityClient } from '../../src/utils/sanityClient.js';
import { modifyDocuments, Mutation } from '../../src/controllers/mutate.js';

// Mock the sanityClient and portableText utils
vi.mock('../../src/utils/sanityClient.js');

describe('Mutate Controller', () => {
  // Mock client and its methods
  const mockClient = {
    transaction: vi.fn(),
    patch: vi.fn(),
    getDocument: vi.fn(),
  };
  
  // Mock transaction object
  const mockTransaction = {
    create: vi.fn().mockReturnThis(),
    createOrReplace: vi.fn().mockReturnThis(),
    createIfNotExists: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    patch: vi.fn().mockReturnThis(),
    commit: vi.fn().mockResolvedValue({ documentIds: ['doc1', 'doc2'] }),
  };
  
  // Mock patch object
  const mockPatch = {
    set: vi.fn().mockReturnThis(),
    setIfMissing: vi.fn().mockReturnThis(),
    unset: vi.fn().mockReturnThis(),
    inc: vi.fn().mockReturnThis(),
    dec: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    ifRevisionId: vi.fn().mockReturnThis(),
    commit: vi.fn().mockResolvedValue({ transactionId: 'transaction123' }),
  };
  
  beforeEach(() => {
    // Set up mocks
    (createSanityClient as any).mockReturnValue(mockClient);
    mockClient.transaction.mockReturnValue(mockTransaction);
    mockClient.patch.mockReturnValue(mockPatch);
    
    // Mock document retrieval
    mockClient.getDocument.mockImplementation((id: string) => {
      if (id === 'article123') {
        return Promise.resolve({
          _id: 'article123',
          title: 'Test Article',
          body: [
            { _type: 'block', children: [{ _type: 'span', text: 'Existing text' }] }
          ]
        });
      }
      return Promise.reject(new Error(`Document ${id} not found`));
    });
    
    // Clear mock call history
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('modifyDocuments', () => {
    it('should throw an error if no mutations are provided', async () => {
      await expect(modifyDocuments('project123', 'dataset123', [])).rejects.toThrow('At least one mutation is required');
    });
    
    it('should create a document', async () => {
      const mutations: Mutation[] = [{
        create: {
          _id: 'person-123',
          _type: 'person',
          name: 'John Doe',
          age: 30
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123');
      expect(mockClient.transaction).toHaveBeenCalled();
      expect(mockTransaction.create).toHaveBeenCalledWith(mutations[0].create);
      expect(mockTransaction.commit).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        message: 'Successfully applied 1 mutations'
      }));
    });
    
    it('should createOrReplace a document', async () => {
      const mutations: Mutation[] = [{
        createOrReplace: {
          _id: 'person-123',
          _type: 'person',
          name: 'John Doe',
          age: 30
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockTransaction.createOrReplace).toHaveBeenCalledWith(mutations[0].createOrReplace);
      expect(mockTransaction.commit).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should createIfNotExists a document', async () => {
      const mutations: Mutation[] = [{
        createIfNotExists: {
          _id: 'person-123',
          _type: 'person',
          name: 'John Doe',
          age: 30
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockTransaction.createIfNotExists).toHaveBeenCalledWith(mutations[0].createIfNotExists);
      expect(mockTransaction.commit).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should delete a document by id', async () => {
      const mutations: Mutation[] = [{
        delete: {
          id: 'person-123'
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockTransaction.delete).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should delete documents by query', async () => {
      const mutations: Mutation[] = [{
        delete: {
          query: '*[_type == "person" && age < $age]',
          params: { age: 18 }
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockTransaction.delete).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should patch a document by id', async () => {
      const mutations: Mutation[] = [{
        patch: {
          id: 'person-123',
          set: {
            name: 'Jane Doe',
            'profile.bio': 'Updated bio'
          },
          inc: {
            age: 1
          },
          unset: ['oldField', 'deprecatedField']
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockClient.patch).toHaveBeenCalledWith('person-123');
      expect(mockPatch.set).toHaveBeenCalledWith({
        name: 'Jane Doe',
        'profile.bio': 'Updated bio'
      });
      expect(mockPatch.inc).toHaveBeenCalledWith({ age: 1 });
      expect(mockPatch.unset).toHaveBeenCalledWith(['oldField', 'deprecatedField']);
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should patch documents by query', async () => {
      const mutations: Mutation[] = [{
        patch: {
          query: '*[_type == "person" && age >= $age]',
          params: { age: 18 },
          set: {
            isAdult: true
          }
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockTransaction.patch).toHaveBeenCalledWith({
        query: '*[_type == "person" && age >= $age]',
        params: { age: 18 },
        set: {
          isAdult: true
        }
      });
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should support optimistic locking with ifRevisionID', async () => {
      const mutations: Mutation[] = [{
        patch: {
          id: 'person-123',
          ifRevisionID: 'rev-abc-123',
          set: {
            name: 'Jane Doe'
          }
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockClient.patch).toHaveBeenCalledWith('person-123');
      expect(mockPatch.ifRevisionId).toHaveBeenCalledWith('rev-abc-123');
      expect(mockPatch.set).toHaveBeenCalledWith({ name: 'Jane Doe' });
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should handle array insertions with various positions', async () => {
      const mutations: Mutation[] = [{
        patch: {
          id: 'article-123',
          insert: {
            items: [{ _type: 'comment', text: 'Great article!' }],
            position: 'after',
            at: 'comments[-1]'
          }
        }
      }];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockClient.patch).toHaveBeenCalledWith('article-123');
      expect(mockPatch.insert).toHaveBeenCalledWith(
        'after', 
        'comments[-1]', 
        [{ _type: 'comment', text: 'Great article!' }]
      );
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should handle multiple mutations in a single transaction', async () => {
      const mutations: Mutation[] = [
        {
          create: {
            _id: 'person-123',
            _type: 'person',
            name: 'John Doe'
          }
        },
        {
          patch: {
            id: 'article-123',
            set: {
              author: 'person-123'
            }
          }
        }
      ];
      
      const result = await modifyDocuments('project123', 'dataset123', mutations);
      
      expect(mockTransaction.create).toHaveBeenCalledWith(mutations[0].create);
      expect(mockClient.patch).toHaveBeenCalledWith('article-123');
      expect(mockPatch.set).toHaveBeenCalledWith({ author: 'person-123' });
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        message: 'Successfully applied 2 mutations'
      }));
    });
    
    it('should throw an error when the transaction fails', async () => {
      mockTransaction.commit.mockRejectedValueOnce(new Error('Transaction failed'));
      
      const mutations: Mutation[] = [{
        create: {
          _id: 'person-123',
          _type: 'person',
          name: 'John Doe'
        }
      }];
      
      await expect(modifyDocuments('project123', 'dataset123', mutations))
        .rejects.toThrow('Failed to modify documents: Transaction failed');
    });
  });
});
