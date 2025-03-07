import { createSanityClient } from '../utils/sanityClient.js';
import { SanityClient } from '@sanity/client';

// Define interface for Sanity transaction
interface SanityTransaction {
  create: (document: Record<string, any>) => SanityTransaction;
  createOrReplace: (document: Record<string, any>) => SanityTransaction;
  createIfNotExists: (document: Record<string, any>) => SanityTransaction;
  delete: (idOrQuery: string) => SanityTransaction;
  patch: (patchObj: SanityPatch | Record<string, any>) => SanityTransaction;
  commit: () => Promise<Record<string, any>>;
}

// Define interface for Sanity patch
interface SanityPatch {
  set: (fields: Record<string, any>) => SanityPatch;
  setIfMissing: (fields: Record<string, any>) => SanityPatch;
  unset: (fields: string[]) => SanityPatch;
  inc: (fields: Record<string, number>) => SanityPatch;
  dec: (fields: Record<string, number>) => SanityPatch;
  insert: (position: 'before' | 'after' | 'replace', path: string, items: any | any[]) => SanityPatch;
  ifRevisionId: (revisionId: string) => SanityPatch;
}

// Define types for mutations
interface SanityDocumentStub<T extends { _type: string }> {
  _type: string;
  [key: string]: any;
}

interface IdentifiedSanityDocumentStub<T extends Record<string, any>> extends SanityDocumentStub<T & { _type: string }> {
  _id: string;
}

export interface CreateMutation {
  create: SanityDocumentStub<{ _type: string }>;
}

export interface CreateOrReplaceMutation {
  createOrReplace: IdentifiedSanityDocumentStub<Record<string, any>>;
}

export interface CreateIfNotExistsMutation {
  createIfNotExists: IdentifiedSanityDocumentStub<Record<string, any>>;
}

export interface DeleteByIdMutation {
  delete: {
    id: string;
  };
}

export interface DeleteByQueryMutation {
  delete: {
    query: string;
    params?: Record<string, any>;
  };
}

export interface PatchByIdMutation {
  patch: {
    id: string;
    ifRevisionID?: string;
    set?: Record<string, any>;
    setIfMissing?: Record<string, any>;
    unset?: string | string[];
    inc?: Record<string, number>;
    dec?: Record<string, number>;
    insert?: {
      items: any[] | any;
      position: 'before' | 'after' | 'replace';
      at: string;
    };
    diffMatchPatch?: Record<string, string>;
  };
}

export interface PatchByQueryMutation {
  patch: {
    query: string;
    params?: Record<string, any>;
    set?: Record<string, any>;
    setIfMissing?: Record<string, any>;
    unset?: string | string[];
    inc?: Record<string, number>;
    dec?: Record<string, number>;
    insert?: {
      items: any[] | any;
      position: 'before' | 'after' | 'replace';
      at: string;
    };
    diffMatchPatch?: Record<string, string>;
  };
}

export type Mutation = 
  | CreateMutation 
  | CreateOrReplaceMutation 
  | CreateIfNotExistsMutation 
  | DeleteByIdMutation 
  | DeleteByQueryMutation 
  | PatchByIdMutation 
  | PatchByQueryMutation;

/**
 * Helper function to add create mutation to a transaction
 * 
 * @param transaction - Sanity transaction
 * @param mutation - Create mutation
 */
function addCreateMutation(
  transaction: SanityTransaction, 
  mutation: CreateMutation
): void {
  transaction.create(mutation.create);
}

/**
 * Helper function to add createOrReplace mutation to a transaction
 * 
 * @param transaction - Sanity transaction
 * @param mutation - CreateOrReplace mutation
 */
function addCreateOrReplaceMutation(
  transaction: SanityTransaction, 
  mutation: CreateOrReplaceMutation
): void {
  transaction.createOrReplace(mutation.createOrReplace);
}

/**
 * Helper function to add createIfNotExists mutation to a transaction
 * 
 * @param transaction - Sanity transaction
 * @param mutation - CreateIfNotExists mutation
 */
function addCreateIfNotExistsMutation(
  transaction: SanityTransaction, 
  mutation: CreateIfNotExistsMutation
): void {
  transaction.createIfNotExists(mutation.createIfNotExists);
}

/**
 * Helper function to add delete mutation to a transaction
 * 
 * @param transaction - Sanity transaction
 * @param mutation - Delete mutation (by ID or query)
 */
function addDeleteMutation(
  transaction: SanityTransaction, 
  mutation: DeleteByIdMutation | DeleteByQueryMutation
): void {
  if ('query' in mutation.delete) {
    // Delete by query
    transaction.delete(mutation.delete.query);
  } else if ('id' in mutation.delete) {
    // Delete by ID
    transaction.delete(mutation.delete.id);
  }
}

/**
 * Helper function to add patch mutation by ID to a transaction
 * 
 * @param client - Sanity client
 * @param transaction - Sanity transaction
 * @param id - Document ID
 * @param ifRevisionID - Optional revision ID for optimistic locking
 * @param patchOperations - Operations to apply in the patch
 */
function addPatchByIdMutation(
  client: SanityClient,
  transaction: SanityTransaction,
  id: string,
  ifRevisionID?: string,
  patchOperations?: Record<string, any>
): void {
  if (!patchOperations) return;
  
  const patch = client.patch(id);
  
  // Apply optimistic locking if ifRevisionID is provided
  if (ifRevisionID) {
    patch.ifRevisionId(ifRevisionID);
  }
  
  applyPatchOperationsToClient(patch, patchOperations);
  
  // Add the patch to the transaction
  transaction.patch(patch);
}

/**
 * Helper function to add patch mutation by query to a transaction
 * 
 * @param transaction - Sanity transaction
 * @param query - GROQ query string
 * @param params - Optional query parameters
 * @param patchOperations - Operations to apply in the patch
 */
function addPatchByQueryMutation(
  transaction: SanityTransaction,
  query: string,
  params?: Record<string, any>,
  patchOperations?: Record<string, any>
): void {
  if (!patchOperations) return;
  
  transaction.patch({
    query,
    params,
    ...constructPatchOperations(patchOperations)
  });
}

/**
 * Helper function to apply patch operations to a Sanity patch client
 * 
 * @param patch - Sanity patch client
 * @param patchOperations - Operations to apply
 */
function applyPatchOperationsToClient(
  patch: SanityPatch,
  patchOperations: Record<string, any>
): void {
  // Apply patch operations in the correct order: set, setIfMissing, unset, inc, dec, insert
  if (patchOperations.set) {
    patch.set(patchOperations.set);
  }
  
  if (patchOperations.setIfMissing) {
    patch.setIfMissing(patchOperations.setIfMissing);
  }
  
  if (patchOperations.unset) {
    patch.unset(Array.isArray(patchOperations.unset) ? patchOperations.unset : [patchOperations.unset]);
  }
  
  if (patchOperations.inc) {
    patch.inc(patchOperations.inc);
  }
  
  if (patchOperations.dec) {
    patch.dec(patchOperations.dec);
  }
  
  if (patchOperations.insert) {
    applyInsertOperation(patch, patchOperations.insert);
  }
}

/**
 * Helper function to apply insert operation to a patch
 * 
 * @param patch - Sanity patch client
 * @param insertOp - Insert operation details
 */
function applyInsertOperation(patch: SanityPatch, insertOp: any): void {
  const { items, position, ...rest } = insertOp;
  if (position === 'before') {
    patch.insert('before', rest.at, items);
  } else if (position === 'after') {
    patch.insert('after', rest.at, items);
  } else if (position === 'replace') {
    patch.insert('replace', rest.at, items);
  }
}

/**
 * Helper function to process a single mutation and add it to the transaction
 * 
 * @param client - Sanity client
 * @param transaction - Sanity transaction
 * @param mutation - Mutation to process
 */
function processMutation(
  client: SanityClient,
  transaction: SanityTransaction,
  mutation: Mutation
): void {
  // Handle create mutation
  if ('create' in mutation) {
    addCreateMutation(transaction, mutation);
  }
  
  // Handle createOrReplace mutation
  if ('createOrReplace' in mutation) {
    addCreateOrReplaceMutation(transaction, mutation);
  }
  
  // Handle createIfNotExists mutation
  if ('createIfNotExists' in mutation) {
    addCreateIfNotExistsMutation(transaction, mutation);
  }
  
  // Handle delete mutation
  if ('delete' in mutation) {
    addDeleteMutation(transaction, mutation);
  }
  
  // Handle patch mutation
  if ('patch' in mutation) {
    const { id, query, params, ifRevisionID, ...patchOperations } = mutation.patch as any;
    
    if (query) {
      // Patch by query
      addPatchByQueryMutation(transaction, query, params, patchOperations);
    } else if (id) {
      // Patch by ID
      addPatchByIdMutation(client, transaction, id, ifRevisionID, patchOperations);
    }
  }
}

/**
 * Helper function to retrieve documents for mutations
 * 
 * @param client - Sanity client
 * @param mutations - Array of mutations
 * @returns Array of retrieved documents
 */
async function retrieveDocumentsForMutations(
  client: SanityClient,
  mutations: Mutation[]
): Promise<any[]> {
  return await Promise.all(mutations.map(async (mutation) => {
    // Type guard for different mutation types
    if ('create' in mutation) {
      return client.getDocument(mutation.create._id);
    } else if ('createOrReplace' in mutation) {
      return client.getDocument(mutation.createOrReplace._id);
    } else if ('createIfNotExists' in mutation) {
      return client.getDocument(mutation.createIfNotExists._id);
    } else if ('patch' in mutation) {
      // Need to handle both patch by ID and patch by query
      if ('id' in mutation.patch) {
        return client.getDocument(mutation.patch.id);
      } else if ('query' in mutation.patch) {
        // For query-based patches we can't easily get the document
        // without executing the query again
        return null;
      }
    }
    return null;
  }));
}

/**
 * Interface for results returned by modifyDocuments
 */
interface MutateDocumentsResult {
  success: boolean;
  message: string;
  result: Record<string, any>;
  documents?: Record<string, any>[];
}

/**
 * Creates or updates documents using Sanity mutations
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param mutations - Array of mutation objects following Sanity mutation format
 * @param returnDocuments - Whether to return modified documents in response
 * @returns Result of the mutations operation
 */
async function modifyDocuments(
  projectId: string, 
  dataset: string, 
  mutations: Mutation[],
  returnDocuments: boolean = false
): Promise<MutateDocumentsResult> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Validate inputs
    if (!mutations || !Array.isArray(mutations) || mutations.length === 0) {
      throw new Error('At least one mutation is required');
    }
    
    // Create a transaction
    const transaction = client.transaction();
    
    // Process each mutation
    mutations.forEach(mutation => {
      processMutation(client, transaction, mutation);
    });
    
    // Commit the transaction
    const result = await transaction.commit();
    
    if (returnDocuments) {
      const documents = await retrieveDocumentsForMutations(client, mutations);
      
      return {
        success: true,
        message: `Successfully applied ${mutations.length} mutations`,
        result,
        documents: documents.filter(Boolean)
      };
    } else {
      return {
        success: true,
        message: `Successfully applied ${mutations.length} mutations`,
        result
      };
    }
  } catch (error: any) {
    console.error(`Error modifying documents:`, error);
    throw new Error(`Failed to modify documents: ${error.message}`);
  }
}

// Export the refactored function
export { modifyDocuments };

/**
 * Helper function to construct patch operations
 * 
 * @param patch - Raw patch object with operations
 * @returns Formatted patch operations
 */
function constructPatchOperations(patch: Record<string, any>): Record<string, any> {
  // Extract operations from the patch object
  const operations: Record<string, any> = {};
  
  // Handle 'set' operations
  if (patch.set) {
    operations.set = patch.set;
  }
  
  // Handle 'setIfMissing' operations
  if (patch.setIfMissing) {
    operations.setIfMissing = patch.setIfMissing;
  }
  
  // Handle 'unset' operations
  if (patch.unset) {
    operations.unset = Array.isArray(patch.unset) ? patch.unset : [patch.unset];
  }
  
  // Handle 'inc' operations
  if (patch.inc) {
    operations.inc = patch.inc;
  }
  
  // Handle 'dec' operations
  if (patch.dec) {
    operations.dec = patch.dec;
  }
  
  // Handle 'insert' operations (for arrays)
  if (patch.insert) {
    operations.insert = patch.insert;
  }
  
  // Handle 'diffMatchPatch' operations
  if (patch.diffMatchPatch) {
    operations.diffMatchPatch = patch.diffMatchPatch;
  }
  
  return operations;
}
