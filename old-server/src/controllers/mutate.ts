import type {
  ContentValue,
  InsertOperation,
  PatchOperations,
  SanityClient,
  SanityDocument,
  SanityMutationResult,
  SanityPatch} from '../types/sanity.js'
import {applyMutationDefaults} from '../utils/defaultValues.js'
import logger from '../utils/logger.js'
import {validateDocument, validateMutations} from '../utils/parameterValidation.js'
import {createSanityClient} from '../utils/sanityClient.js'

// Define mutation types
export interface CreateMutation {
  create: SanityDocumentStub;
}

export interface CreateIfNotExistsMutation {
  createIfNotExists: IdentifiedSanityDocumentStub;
}

export interface CreateOrReplaceMutation {
  createOrReplace: IdentifiedSanityDocumentStub;
}

export interface DeleteMutation {
  delete: {
    id: string;
  };
}

export interface PatchMutation {
  patch: {
    id: string;
    query?: string;
    ifRevisionID?: string;
    unset?: string[];
    set?: Record<string, ContentValue>;
    inc?: Record<string, number>;
    dec?: Record<string, number>;
    insert?: InsertOperation;
    diffMatchPatch?: Record<string, string>;
  };
}

// Define types for mutations
interface SanityDocumentStub {
  _type: string;
  [key: string]: ContentValue;
}

interface IdentifiedSanityDocumentStub extends SanityDocumentStub {
  _id: string;
}

// Define our own transaction interface that supports both ways of calling patch
interface Transaction {
  create: (doc: SanityDocumentStub) => Transaction;
  createOrReplace: (doc: IdentifiedSanityDocumentStub) => Transaction;
  createIfNotExists: (doc: IdentifiedSanityDocumentStub) => Transaction;
  delete: (documentId: string) => Transaction;
  patch: ((documentId: string, patchSpec: Record<string, unknown>) => Transaction) &
         ((queryPatch: Record<string, unknown>) => Transaction);
  commit: (options?: { visibility?: 'sync' | 'async' | 'deferred' }) => Promise<SanityMutationResult>;
}

export type Mutation =
  | CreateMutation
  | CreateOrReplaceMutation
  | CreateIfNotExistsMutation
  | PatchMutation
  | DeleteMutation;

/**
 * Helper function to add create mutation to a transaction
 *
 * @param transaction - Sanity transaction
 * @param mutation - Create mutation
 */
function addCreateMutation(
  transaction: Transaction,
  mutation: CreateMutation
): void {
  transaction.create(mutation.create)
}

/**
 * Helper function to add createOrReplace mutation to a transaction
 *
 * @param transaction - Sanity transaction
 * @param mutation - CreateOrReplace mutation
 */
function addCreateOrReplaceMutation(
  transaction: Transaction,
  mutation: CreateOrReplaceMutation
): void {
  transaction.createOrReplace(mutation.createOrReplace)
}

/**
 * Helper function to add createIfNotExists mutation to a transaction
 *
 * @param transaction - Sanity transaction
 * @param mutation - CreateIfNotExists mutation
 */
function addCreateIfNotExistsMutation(
  transaction: Transaction,
  mutation: CreateIfNotExistsMutation
): void {
  transaction.createIfNotExists(mutation.createIfNotExists)
}

/**
 * Helper function to add delete mutation to a transaction
 *
 * @param transaction - Sanity transaction
 * @param mutation - Delete mutation
 */
function addDeleteMutation(
  transaction: Transaction,
  mutation: DeleteMutation
): void {
  transaction.delete(mutation.delete.id)
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
  transaction: Transaction,
  id: string,
  ifRevisionID?: string,
  patchOperations?: PatchOperations
): void {
  if (!patchOperations) {
    return
  }

  const patch = client.patch(id)

  // Apply optimistic locking if ifRevisionID is provided
  if (ifRevisionID) {
    patch.ifRevisionId(ifRevisionID)
  }

  // Apply patch operations using type assertion to work around type incompatibility
  // First cast to unknown to avoid type compatibility errors
  applyPatchOperationsToClient(patch as unknown as SanityPatch, patchOperations)

  // Add the patch to the transaction with the correct signature
  // First cast to unknown to avoid type compatibility errors
  transaction.patch(id, patch as unknown as Record<string, unknown>)
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
  transaction: Transaction,
  query: string,
  params?: Record<string, ContentValue>,
  patchOperations?: PatchOperations
): void {
  if (!patchOperations) {
    return
  }

  // Create a patch spec object that includes the query and params directly
  const patchSpec = {
    query,
    params,
    ...patchOperations
  }

  // Call transaction.patch directly with the patch spec object
  transaction.patch(patchSpec)
}

/**
 * Helper function to apply patch operations to a patch client
 *
 * @param patch - Sanity patch client
 * @param patchOperations - Operations to apply
 */
function applyPatchOperationsToClient(
  patch: {
    set: (attributes: Record<string, ContentValue>) => unknown;
    setIfMissing: (attributes: Record<string, ContentValue>) => unknown;
    unset: (attributes: string[]) => unknown;
    inc: (attributes: Record<string, number>) => unknown;
    dec: (attributes: Record<string, number>) => unknown;
    insert: (position: 'before' | 'after' | 'replace', selector: string, items: unknown[] | unknown) => unknown;
  },
  patchOperations: PatchOperations
): void {
  // Apply patch operations in the correct order: set, setIfMissing, unset, inc, dec, insert
  if (patchOperations.set) {
    patch.set(patchOperations.set)
  }

  if (patchOperations.setIfMissing) {
    patch.setIfMissing(patchOperations.setIfMissing)
  }

  if (patchOperations.unset) {
    patch.unset(Array.isArray(patchOperations.unset) ? patchOperations.unset : [patchOperations.unset])
  }

  if (patchOperations.inc) {
    patch.inc(patchOperations.inc)
  }

  if (patchOperations.dec) {
    patch.dec(patchOperations.dec)
  }

  if (patchOperations.insert) {
    applyInsertOperation(patch as SanityPatch, patchOperations.insert)
  }
}

/**
 * Helper function to apply an insert operation to a patch
 *
 * @param patch - Sanity patch
 * @param insertOp - Insert operation
 */
function applyInsertOperation(patch: SanityPatch, insertOp: InsertOperation): void {
  const {items, position} = insertOp

  // Get the appropriate selector
  let selector = ''
  if (insertOp.at) {
    selector = insertOp.at
  } else if (insertOp.before) {
    selector = insertOp.before
  } else if (insertOp.after) {
    selector = insertOp.after
  } else if (insertOp.replace) {
    selector = insertOp.replace
  }

  if (position === 'before' || position === 'after' || position === 'replace') {
    // Only execute if we have a valid selector and items
    if (selector && items) {
      patch.insert(position, selector, items)
    }
  }
}

/**
 * Helper function to process a single mutation and add it to the transaction
 *
 * @param client - Sanity clien
 * @param transaction - Sanity transaction
 * @param mutation - Mutation to process
 */
function processMutation(
  client: SanityClient,
  transaction: Transaction,
  mutation: Mutation
): void {
  // Handle create mutation
  if ('create' in mutation) {
    addCreateMutation(transaction, mutation)
  }

  // Handle createOrReplace mutation
  if ('createOrReplace' in mutation) {
    addCreateOrReplaceMutation(transaction, mutation)
  }

  // Handle createIfNotExists mutation
  if ('createIfNotExists' in mutation) {
    addCreateIfNotExistsMutation(transaction, mutation)
  }

  // Handle delete mutation
  if ('delete' in mutation) {
    addDeleteMutation(transaction, mutation)
  }

  // Handle patch mutation
  if ('patch' in mutation) {
    const {id, query, params, ifRevisionID, ...patchOperations} = mutation.patch as PatchOperations & {
      id?: string;
      query?: string;
      params?: Record<string, ContentValue>;
      ifRevisionID?: string
    }

    if (query) {
      // Patch by query
      addPatchByQueryMutation(transaction, query, params, patchOperations)
    } else if (id) {
      // Patch by ID
      addPatchByIdMutation(client, transaction, id, ifRevisionID, patchOperations)
    }
  }
}

/**
 * Retrieves a document after a create mutation
 *
 * @param client - Sanity client
 * @param document - Document with ID
 * @returns Retrieved document or null if not found
 */
async function retrieveDocumentForCreateMutation(
  client: SanityClient,
  document: SanityDocumentStub
): Promise<SanityDocument | null> {
  if (document && '_id' in document && document._id) {
    try {
      // Ensure document._id is treated as a string
      const documentId = String(document._id)
      const doc = await client.getDocument(documentId)
      return doc || null
    } catch (error) {
      console.error('Error retrieving document:', error)
      return null
    }
  }
  return null
}

/**
 * Retrieves a document after a patch mutation
 *
 * @param client - Sanity clien
 * @param patch - Patch information
 * @returns Retrieved document or null if not found/applicable
 */
async function retrieveDocumentForPatchMutation(
  client: SanityClient,
  patch: PatchMutation['patch']
): Promise<SanityDocument | null> {
  if ('id' in patch && patch.id) {
    try {
      const doc = await client.getDocument(patch.id)
      return doc || null
    } catch (error) {
      console.error('Error retrieving document:', error)
      return null
    }
  }
  return null
}

/**
 * Retrieves a document for a specific mutation
 *
 * @param client - Sanity clien
 * @param mutation - The mutation to retrieve document for
 * @returns The document or null
 */
async function retrieveDocumentForMutation(
  client: SanityClient,
  mutation: Mutation
): Promise<SanityDocument | null> {
  try {
    // Type guard for different mutation types
    if ('create' in mutation) {
      return await retrieveDocumentForCreateMutation(client, mutation.create)
    } else if ('createOrReplace' in mutation) {
      return await retrieveDocumentForCreateMutation(client, mutation.createOrReplace)
    } else if ('createIfNotExists' in mutation) {
      return await retrieveDocumentForCreateMutation(client, mutation.createIfNotExists)
    } else if ('patch' in mutation) {
      return await retrieveDocumentForPatchMutation(client, mutation.patch)
    } else if ('delete' in mutation) {
      // Deleted documents don't need to be returned
      return null
    }

    // Unknown mutation type
    return null
  } catch (error) {
    console.error('Error retrieving document for mutation:', error)
    return null
  }
}

/**
 * Retrieves documents for each mutation
 *
 * @param client - Sanity clien
 * @param mutations - Array of mutations
 * @returns Array of documents or null values
 */
async function retrieveDocumentsForMutations(
  client: SanityClient,
  mutations: Mutation[]
): Promise<(SanityDocument | null)[]> {
  // Process each mutation in parallel with Promise.all
  return Promise.all(
    mutations.map((mutation) => retrieveDocumentForMutation(client, mutation))
  )
}

/**
 * Interface for results returned by modifyDocuments
 */
interface MutateDocumentsResult {
  success: boolean;
  message: string;
  result: {
    transactionId: string;
    documentIds: string[];
    results: Array<{
      id: string;
      operation: string;
    }>;
  };
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
    const client = createSanityClient(projectId, dataset)

    // Validate mutations using the parameterValidation utility
    validateMutations(mutations)

    // Apply default values
    const mutationOptions = applyMutationDefaults({
      returnDocuments,
      ...options
    })

    // Create a transaction
    const transaction = client.transaction()

    // Process each mutation
    mutations.forEach((mutation) => {
      // Validate create documents using the parameterValidation utility
      if ('create' in mutation && mutation.create) {
        validateDocument(mutation.create)
      }

      // Validate createOrReplace documents
      if ('createOrReplace' in mutation && mutation.createOrReplace) {
        validateDocument(mutation.createOrReplace)
      }

      // Validate createIfNotExists documents
      if ('createIfNotExists' in mutation && mutation.createIfNotExists) {
        validateDocument(mutation.createIfNotExists)
      }

      // Add proper type information to the document before passing to transaction
      processMutation(client, transaction as unknown as Transaction, mutation)
    })

    // Commit the transaction with visibility option
    const result = await transaction.commit({
      visibility: mutationOptions.visibility
    })

    if (mutationOptions.returnDocuments) {
      const documents = await retrieveDocumentsForMutations(client, mutations)

      return {
        success: true,
        message: `Successfully applied ${mutations.length} mutations`,
        result,
        documents: documents.filter(Boolean) as SanityDocument[]
      }
    }

    return {
      success: true,
      message: `Successfully applied ${mutations.length} mutations`,
      result
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to modify documents: ${errorMessage}`)
  }
}

// Export the refactored function
export {modifyDocuments}

// Fix for the first error
export async function createDocument(
  projectId: string,
  dataset: string,
  document: IdentifiedSanityDocumentStub,
): Promise<SanityDocument | null> {
  const client = createSanityClient(projectId, dataset)

  try {
    logger.info(`Creating document of type ${document._type}`)
    // Execute the create operation but don't store the result since we don't use i
    await client.createOrReplace(document)
    const createdDoc = await client.getDocument(document._id)
    return createdDoc || null // Add null check
  } catch (error) {
    throw new Error(`Failed to create document: ${(error as Error).message}`)
  }
}

// Fix for the second error
export async function patchDocument(
  projectId: string,
  dataset: string,
  patch: {
    id: string;
    set?: Record<string, ContentValue>;
    unset?: string[] | string;
  },
): Promise<SanityDocument | null> {
  const client = createSanityClient(projectId, dataset)

  try {
    logger.info(`Patching document with ID ${patch.id}`)
    // Convert string to array if needed
    const unsetFields = typeof patch.unset === 'string' ? [patch.unset] : patch.unset || []
    await client.patch(patch.id).set(patch.set || {}).unset(unsetFields)
      .commit()
    const updatedDoc = await client.getDocument(patch.id)
    return updatedDoc || null // Add null check
  } catch (error) {
    throw new Error(`Failed to patch document: ${(error as Error).message}`)
  }
}

export interface MutationOptions {
  returnDocuments?: boolean;
  visibility?: 'sync' | 'async' | 'deferred';
  dryRun?: boolean;
  autoGenerateArrayKeys?: boolean;
  skipCrossDatasetReferenceValidation?: boolean;
  params?: Record<string, ContentValue>;
}

export interface MutationResult {
  transactionId: string;
  documentIds: string[];
  results: Array<{
    id: string;
    operation: string;
  }>;
  result: Record<string, ContentValue>;
  documents?: SanityDocument[];
}
