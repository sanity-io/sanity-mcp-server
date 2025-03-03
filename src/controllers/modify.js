import { createSanityClient } from '../utils/sanityClient.js';
import { markdownToPortableText } from '../utils/portableText.js';

/**
 * Modifies documents matching a query or list of IDs
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name
 * @param {string} query - GROQ query to select documents to modify
 * @param {Array<string>} documentIds - Explicit list of document IDs to modify
 * @param {Object} patch - Patch operations to apply (set, unset, inc, etc.)
 * @returns {Promise<Object>} Result of the modification operation
 */
export async function modifyDocuments(projectId, dataset, query, documentIds, patch) {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Validate inputs - either query or documentIds must be provided
    if (!query && (!documentIds || documentIds.length === 0)) {
      throw new Error('Either query or documentIds must be provided');
    }
    
    let result;
    
    // If query is provided, use it for patching
    if (query) {
      // Create a transaction for the query-based patch
      const transaction = client.transaction();
      
      // Add the patch operations
      transaction.patch({
        query,
        ...constructPatchOperations(patch)
      });
      
      // Commit the transaction
      result = await transaction.commit();
      
      return {
        success: true,
        message: `Modified documents matching query: ${query}`,
        affectedDocuments: result.documentIds || [],
        result
      };
    }
    
    // If documentIds is provided, patch each document
    if (documentIds && documentIds.length > 0) {
      // Create a transaction
      const transaction = client.transaction();
      
      // Add a patch for each document ID
      documentIds.forEach(docId => {
        transaction.patch(docId, constructPatchOperations(patch));
      });
      
      // Commit the transaction
      result = await transaction.commit();
      
      return {
        success: true,
        message: `Modified ${documentIds.length} documents`,
        affectedDocuments: result.documentIds || [],
        result
      };
    }
  } catch (error) {
    console.error(`Error modifying documents:`, error);
    throw new Error(`Failed to modify documents: ${error.message}`);
  }
}

/**
 * Modifies a Portable Text field using Markdown
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name
 * @param {string} documentId - Document ID to modify
 * @param {string} fieldPath - Path to the Portable Text field (e.g., "body")
 * @param {string} markdown - New content in Markdown format
 * @returns {Promise<Object>} Result of the modification operation
 */
export async function modifyPortableTextField(projectId, dataset, documentId, fieldPath, markdown) {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Convert Markdown to Portable Text
    const portableText = markdownToPortableText(markdown);
    
    // Create a patch
    const patch = {
      set: {
        [fieldPath]: portableText
      }
    };
    
    // Apply the patch
    const result = await client
      .patch(documentId)
      .set({ [fieldPath]: portableText })
      .commit();
    
    return {
      success: true,
      message: `Modified Portable Text field '${fieldPath}' in document ${documentId}`,
      documentId,
      result
    };
  } catch (error) {
    console.error(`Error modifying Portable Text field:`, error);
    throw new Error(`Failed to modify Portable Text field: ${error.message}`);
  }
}

/**
 * Helper function to construct patch operations
 * 
 * @param {Object} patch - Raw patch object with operations
 * @returns {Object} Formatted patch operations
 */
function constructPatchOperations(patch) {
  // Extract operations from the patch object
  const operations = {};
  
  // Handle 'set' operations
  if (patch.set) {
    operations.set = patch.set;
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
  
  return operations;
}
