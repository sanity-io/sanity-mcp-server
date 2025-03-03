import { createSanityClient } from '../utils/sanityClient.js';
import { markdownToPortableText } from '../utils/portableText.js';

// Define types for mutations
export interface CreateMutation {
  create: Record<string, any>;
}

export interface CreateOrReplaceMutation {
  createOrReplace: Record<string, any>;
}

export interface CreateIfNotExistsMutation {
  createIfNotExists: Record<string, any>;
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

export interface PortableTextOperation {
  type: 'insert' | 'replace' | 'remove';
  position?: 'beginning' | 'end' | 'at';
  atIndex?: number;
  value?: string | any[] | any;
}

/**
 * Creates or updates documents using Sanity mutations
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param mutations - Array of mutation objects following Sanity mutation format
 * @returns Result of the mutations operation
 */
export async function modifyDocuments(
  projectId: string, 
  dataset: string, 
  mutations: Mutation[]
): Promise<{
  success: boolean;
  message: string;
  result: any;
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
          transaction.delete({
            query: mutation.delete.query,
            params: mutation.delete.params
          });
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
    
    return {
      success: true,
      message: `Successfully applied ${mutations.length} mutations`,
      result
    };
  } catch (error: any) {
    console.error(`Error modifying documents:`, error);
    throw new Error(`Failed to modify documents: ${error.message}`);
  }
}

/**
 * Modifies a Portable Text field using Markdown
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param documentId - Document ID to modify
 * @param fieldPath - Path to the Portable Text field (e.g., "body")
 * @param operations - Array of operations to perform on the field
 * @returns Result of the modification operation
 */
export async function modifyPortableTextField(
  projectId: string, 
  dataset: string, 
  documentId: string, 
  fieldPath: string, 
  operations: PortableTextOperation[]
): Promise<{
  success: boolean;
  message: string;
  documentId: string;
  operations: number;
  result: any;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Create a patch for the document
    const patch = client.patch(documentId);
    
    // Process each operation
    for (const op of operations) {
      switch (op.type) {
        case 'insert':
          if (!op.value) continue;
          
          // Convert value if it's markdown
          const content = typeof op.value === 'string' 
            ? markdownToPortableText(op.value) 
            : op.value;
          
          // Handle insertion at different positions
          if (op.position === 'beginning') {
            // Get current field value first
            const doc = await client.getDocument(documentId);
            const currentField = doc && doc[fieldPath] ? doc[fieldPath] : [];
            
            // Set the field with new content at beginning
            patch.set({
              [fieldPath]: [...(Array.isArray(content) ? content : [content]), ...currentField]
            });
          } else if (op.position === 'end') {
            // Get current field value first
            const doc = await client.getDocument(documentId);
            const currentField = doc && doc[fieldPath] ? doc[fieldPath] : [];
            
            // Set the field with new content at end
            patch.set({
              [fieldPath]: [...currentField, ...(Array.isArray(content) ? content : [content])]
            });
          } else if (op.position === 'at' && op.atIndex !== undefined) {
            // Get current field value first
            const doc = await client.getDocument(documentId);
            const currentField = doc && doc[fieldPath] ? doc[fieldPath] : [];
            
            // Insert at specific position
            const newContent = [...currentField];
            newContent.splice(op.atIndex, 0, ...(Array.isArray(content) ? content : [content]));
            
            patch.set({
              [fieldPath]: newContent
            });
          }
          break;
          
        case 'replace':
          if (!op.value) continue;
          
          // Convert value if it's markdown
          const replacementContent = typeof op.value === 'string' 
            ? markdownToPortableText(op.value) 
            : op.value;
          
          if (op.position === 'at' && op.atIndex !== undefined) {
            // Get current field value first
            const doc = await client.getDocument(documentId);
            const currentField = doc && doc[fieldPath] ? doc[fieldPath] : [];
            
            // Replace at specific position
            const newContent = [...currentField];
            newContent.splice(op.atIndex, 1, ...(Array.isArray(replacementContent) ? replacementContent : [replacementContent]));
            
            patch.set({
              [fieldPath]: newContent
            });
          } else {
            // Full replacement
            patch.set({
              [fieldPath]: replacementContent
            });
          }
          break;
          
        case 'remove':
          if (op.position === 'at' && op.atIndex !== undefined) {
            // Get current field value first
            const doc = await client.getDocument(documentId);
            const currentField = doc && doc[fieldPath] ? doc[fieldPath] : [];
            
            // Remove at specific position
            const newContent = [...currentField];
            newContent.splice(op.atIndex, 1);
            
            patch.set({
              [fieldPath]: newContent
            });
          }
          break;
          
        default:
          // Unknown operation
          console.warn(`Unknown operation type: ${op.type}`);
      }
    }
    
    // Commit the patches
    const result = await patch.commit();
    
    return {
      success: true,
      message: `Modified Portable Text field '${fieldPath}' in document ${documentId}`,
      documentId,
      operations: operations.length,
      result
    };
  } catch (error: any) {
    console.error(`Error modifying Portable Text field:`, error);
    throw new Error(`Failed to modify Portable Text field: ${error.message}`);
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
