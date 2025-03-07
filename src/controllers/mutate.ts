import { createSanityClient } from '../utils/sanityClient.js';

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
 * Creates or updates documents using Sanity mutations
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param mutations - Array of mutation objects following Sanity mutation format
 * @param returnDocuments - Whether to return modified documents in response
 * @returns Result of the mutations operation
 */
export async function modifyDocuments(
  projectId: string, 
  dataset: string, 
  mutations: Mutation[],
  returnDocuments: boolean = false
): Promise<{
  success: boolean;
  message: string;
  result: any;
  documents?: any[];
}> {
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
      // Handle create mutation
      if ('create' in mutation) {
        transaction.create(mutation.create);
      }
      
      // Handle createOrReplace mutation
      if ('createOrReplace' in mutation) {
        transaction.createOrReplace(mutation.createOrReplace);
      }
      
      // Handle createIfNotExists mutation
      if ('createIfNotExists' in mutation) {
        transaction.createIfNotExists(mutation.createIfNotExists);
      }
      
      // Handle delete mutation
      if ('delete' in mutation) {
        if ('query' in mutation.delete) {
          // Delete by query
          transaction.delete(mutation.delete.query);
        } else if ('id' in mutation.delete) {
          // Delete by ID
          transaction.delete(mutation.delete.id);
        }
      }
      
      // Handle patch mutation
      if ('patch' in mutation) {
        const { id, query, params, ifRevisionID, ...patchOperations } = mutation.patch as any;
        
        if (query) {
          // Patch by query
          transaction.patch({
            query,
            params,
            ...constructPatchOperations(patchOperations)
          });
        } else if (id) {
          // Patch by ID
          const patch = client.patch(id);
          
          // Apply optimistic locking if ifRevisionID is provided
          if (ifRevisionID) {
            patch.ifRevisionId(ifRevisionID);
          }
          
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
            const { items, position, ...rest } = patchOperations.insert;
            if (position === 'before') {
              patch.insert('before', rest.at, items);
            } else if (position === 'after') {
              patch.insert('after', rest.at, items);
            } else if (position === 'replace') {
              patch.insert('replace', rest.at, items);
            }
          }
          
          // Add the patch to the transaction
          transaction.patch(patch);
        }
      }
    });
    
    // Commit the transaction
    const result = await transaction.commit();
    
    if (returnDocuments) {
      const documents = await Promise.all(mutations.map(async (mutation) => {
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
