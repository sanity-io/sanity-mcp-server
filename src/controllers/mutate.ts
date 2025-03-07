import { createSanityClient } from '../utils/sanityClient.js';
import { SanityClient, SanityError, SanityDocument, InsertOperation, PatchOperations } from '../types/sanity.js';
import { validateMutations, validateDocument } from '../utils/parameterValidation.js';
import { applyMutationDefaults } from '../utils/defaultValues.js';

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

export interface DeleteMutation {
  delete: {
    id: string;
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
    insert?: InsertOperation;
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
    insert?: InsertOperation;
    diffMatchPatch?: Record<string, string>;
  };
}

export type Mutation = 
  | CreateMutation 
  | CreateOrReplaceMutation 
  | CreateIfNotExistsMutation 
  | PatchByIdMutation 
  | PatchByQueryMutation 
  | DeleteMutation;

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
 * @param mutation - Delete mutation
 */
function addDeleteMutation(
  transaction: SanityTransaction, 
  mutation: DeleteMutation
): void {
  transaction.delete(mutation.delete.id);
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
  patchOperations?: PatchOperations
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
  patchOperations?: PatchOperations
): void {
  if (!patchOperations) return;
  
  transaction.patch({
    query,
    params,
    ...patchOperations
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
  patchOperations: PatchOperations
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
 * @param patch - Sanity patch
 * @param insertOp - Insert operation
 */
function applyInsertOperation(patch: SanityPatch, insertOp: InsertOperation): void {
  const { items, position } = insertOp;
  
  // Get the appropriate selector
  let selector = '';
  if (insertOp.at) {
    selector = insertOp.at;
  } else if (insertOp.before) {
    selector = insertOp.before;
  } else if (insertOp.after) {
    selector = insertOp.after;
  } else if (insertOp.replace) {
    selector = insertOp.replace;
  }
  
  if (position === 'before' || position === 'after' || position === 'replace') {
    // Only execute if we have a valid selector and items
    if (selector && items) {
      patch.insert(position, selector, items);
    }
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
    const { id, query, params, ifRevisionID, ...patchOperations } = mutation.patch as PatchOperations & { id?: string; query?: string; params?: Record<string, any>; ifRevisionID?: string };
    
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
): Promise<(SanityDocument | null)[]> {
  const results = await Promise.all(mutations.map(async (mutation) => {
    try {
      // Type guard for different mutation types
      if ('create' in mutation && mutation.create?._id) {
        return await client.getDocument(mutation.create._id);
      } else if ('createOrReplace' in mutation && mutation.createOrReplace?._id) {
        return await client.getDocument(mutation.createOrReplace._id);
      } else if ('createIfNotExists' in mutation && mutation.createIfNotExists?._id) {
        return await client.getDocument(mutation.createIfNotExists._id);
      } else if ('patch' in mutation) {
        // Need to handle both patch by ID and patch by query
        if ('id' in mutation.patch && mutation.patch.id) {
          return await client.getDocument(mutation.patch.id);
        } 
        // Query-based patches can't easily return documents
        return null;
      } else if ('delete' in mutation) {
        // Deleted documents don't need to be returned
        return null;
      }
      return null;
    } catch (err) {
      console.error(`Error retrieving document for mutation:`, err);
      return null;
    }
  }));
  
  // All results are either SanityDocument or null at this point
  return results as (SanityDocument | null)[];
}

/**
 * Interface for results returned by modifyDocuments
 */
interface MutateDocumentsResult {
  success: boolean;
  message: string;
  result: Record<string, any>;
  documents?: SanityDocument[];
}

/**
 * Modifies documents using transactions
 * 
 * @param projectId - Project ID
 * @param dataset - Dataset name
 * @param mutations - Array of mutations
 * @param returnDocuments - Whether to return the modified documents
 * @param options - Additional options for the mutation
 * @returns Result object containing success status, message, and potentially documents
 */
async function modifyDocuments(
  projectId: string, 
  dataset: string, 
  mutations: Mutation[],
  returnDocuments: boolean = false,
  options?: {
    visibility?: 'sync' | 'async' | 'deferred';
  }
): Promise<MutateDocumentsResult> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Validate mutations using the parameterValidation utility
    validateMutations(mutations);
    
    // Apply default values
    const mutationOptions = applyMutationDefaults({
      returnDocuments,
      ...options
    });
    
    // Create a transaction
    const transaction = client.transaction();
    
    // Process each mutation
    mutations.forEach(mutation => {
      // Validate create documents using the parameterValidation utility
      if ('create' in mutation && mutation.create) {
        validateDocument(mutation.create);
      }
      
      // Validate createOrReplace documents
      if ('createOrReplace' in mutation && mutation.createOrReplace) {
        validateDocument(mutation.createOrReplace);
      }
      
      // Validate createIfNotExists documents
      if ('createIfNotExists' in mutation && mutation.createIfNotExists) {
        validateDocument(mutation.createIfNotExists);
      }
      
      // Add proper type information to the document before passing to transaction
      processMutation(client, transaction as any, mutation);
    });
    
    // Commit the transaction with visibility option
    const result = await transaction.commit({
      visibility: mutationOptions.visibility
    });
    
    if (mutationOptions.returnDocuments) {
      const documents = await retrieveDocumentsForMutations(client, mutations);
      
      return {
        success: true,
        message: `Successfully applied ${mutations.length} mutations`,
        result,
        documents: documents.filter(Boolean) as SanityDocument[]
      };
    }
    
    return {
      success: true,
      message: `Successfully applied ${mutations.length} mutations`,
      result
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to modify documents: ${errorMessage}`);
  }
}

/**
 * Helper function to construct patch operations
 * 
 * @param patch - Raw patch object with operations
 * @returns Formatted patch operations
 */
function constructPatchOperations(patch: Record<string, any>): PatchOperations {
  // Extract operations from the patch object
  const operations: PatchOperations = {};
  
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

// Export the refactored function
export { modifyDocuments };
