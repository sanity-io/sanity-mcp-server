import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSanityClient } from '../../src/utils/sanityClient.js';
import { modifyDocuments, modifyPortableTextField, Mutation, PortableTextOperation } from '../../src/controllers/mutate.js';
import { markdownToPortableText } from '../../src/utils/portableText.js';

// Mock the sanityClient and portableText utils
vi.mock('../../src/utils/sanityClient.js');
vi.mock('../../src/utils/portableText.js');

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
    
    // Mock portable text conversion
    (markdownToPortableText as any).mockImplementation((markdown: string) => {
      return [
        { 
          _type: 'block', 
          children: [{ _type: 'span', text: `Converted from markdown: ${markdown}` }] 
        }
      ];
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
  
  describe('modifyPortableTextField', () => {
    it('should replace portable text field with new content', async () => {
      const operations: PortableTextOperation[] = [
        {
          type: 'replace',
          value: 'New markdown content'
        }
      ];
      
      const result = await modifyPortableTextField('project123', 'dataset123', 'article123', 'body', operations);
      
      expect(createSanityClient).toHaveBeenCalledWith('project123', 'dataset123');
      expect(mockClient.patch).toHaveBeenCalledWith('article123');
      expect(markdownToPortableText).toHaveBeenCalledWith('New markdown content');
      expect(mockPatch.set).toHaveBeenCalledWith({
        body: [{ _type: 'block', children: [{ _type: 'span', text: 'Converted from markdown: New markdown content' }] }]
      });
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        documentId: 'article123',
        operations: 1
      }));
    });
    
    it('should insert content at the beginning of field', async () => {
      const operations: PortableTextOperation[] = [
        {
          type: 'insert',
          position: 'beginning',
          value: 'New heading'
        }
      ];
      
      const result = await modifyPortableTextField('project123', 'dataset123', 'article123', 'body', operations);
      
      expect(mockClient.getDocument).toHaveBeenCalledWith('article123');
      expect(markdownToPortableText).toHaveBeenCalledWith('New heading');
      expect(mockPatch.set).toHaveBeenCalledWith({
        body: [
          { _type: 'block', children: [{ _type: 'span', text: 'Converted from markdown: New heading' }] },
          { _type: 'block', children: [{ _type: 'span', text: 'Existing text' }] }
        ]
      });
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should insert content at the end of field', async () => {
      const operations: PortableTextOperation[] = [
        {
          type: 'insert',
          position: 'end',
          value: 'New conclusion'
        }
      ];
      
      const result = await modifyPortableTextField('project123', 'dataset123', 'article123', 'body', operations);
      
      expect(mockClient.getDocument).toHaveBeenCalledWith('article123');
      expect(markdownToPortableText).toHaveBeenCalledWith('New conclusion');
      expect(mockPatch.set).toHaveBeenCalledWith({
        body: [
          { _type: 'block', children: [{ _type: 'span', text: 'Existing text' }] },
          { _type: 'block', children: [{ _type: 'span', text: 'Converted from markdown: New conclusion' }] }
        ]
      });
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should insert content at a specific position', async () => {
      const operations: PortableTextOperation[] = [
        {
          type: 'insert',
          position: 'at',
          atIndex: 0,
          value: 'New content'
        }
      ];
      
      const result = await modifyPortableTextField('project123', 'dataset123', 'article123', 'body', operations);
      
      expect(mockClient.getDocument).toHaveBeenCalledWith('article123');
      expect(markdownToPortableText).toHaveBeenCalledWith('New content');
      expect(mockPatch.set).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should replace content at a specific position', async () => {
      const operations: PortableTextOperation[] = [
        {
          type: 'replace',
          position: 'at',
          atIndex: 0,
          value: 'Replacement content'
        }
      ];
      
      const result = await modifyPortableTextField('project123', 'dataset123', 'article123', 'body', operations);
      
      expect(mockClient.getDocument).toHaveBeenCalledWith('article123');
      expect(markdownToPortableText).toHaveBeenCalledWith('Replacement content');
      expect(mockPatch.set).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should remove content at a specific position', async () => {
      const operations: PortableTextOperation[] = [
        {
          type: 'remove',
          position: 'at',
          atIndex: 0
        }
      ];
      
      const result = await modifyPortableTextField('project123', 'dataset123', 'article123', 'body', operations);
      
      expect(mockClient.getDocument).toHaveBeenCalledWith('article123');
      expect(mockPatch.set).toHaveBeenCalledWith({
        body: []
      });
      
      expect(result).toEqual(expect.objectContaining({
        success: true
      }));
    });
    
    it('should handle multiple operations in sequence', async () => {
      const operations: PortableTextOperation[] = [
        {
          type: 'replace',
          value: 'Initial content'
        },
        {
          type: 'insert',
          position: 'end',
          value: 'Additional content'
        }
      ];
      
      const result = await modifyPortableTextField('project123', 'dataset123', 'article123', 'body', operations);
      
      expect(markdownToPortableText).toHaveBeenCalledTimes(2);
      expect(mockPatch.set).toHaveBeenCalledTimes(2);
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
        operations: 2
      }));
    });
    
    it('should throw an error when the patch fails', async () => {
      mockPatch.commit.mockRejectedValueOnce(new Error('Patch failed'));
      
      const operations: PortableTextOperation[] = [
        {
          type: 'replace',
          value: 'New content'
        }
      ];
      
      await expect(modifyPortableTextField('project123', 'dataset123', 'article123', 'body', operations))
        .rejects.toThrow('Failed to modify Portable Text field: Patch failed');
    });
  });
});
