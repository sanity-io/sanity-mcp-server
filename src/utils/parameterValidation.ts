/**
 * Parameter validation utilities
 *
 * This file provides utility functions for validating parameters used in
 * controllers and tools. These functions ensure that required parameters
 * are present and properly formatted before operations are performed.
 */

import config from '../config/config.js'

/**
 * Validates and normalizes project ID and dataset parameters
 *
 * @param projectId Optional project ID parameter
 * @param dataset Optional dataset parameter
 * @returns Object containing validated project ID and dataset
 * @throws Error if required parameters cannot be determined
 */
export function validateProjectDataset(projectId?: string, dataset?: string): { projectId: string, dataset: string } {
  // Try parameters first, then config values
  const finalProjectId = projectId || config.projectId
  const finalDataset = dataset || config.dataset

  if (!finalProjectId) {
    throw new Error('Project ID is required but not provided in parameters or config')
  }

  if (!finalDataset) {
    throw new Error('Dataset is required but not provided in parameters or config')
  }

  return {projectId: finalProjectId, dataset: finalDataset}
}

/**
 * Validates document ID parameter
 *
 * @param documentId Document ID or array of document IDs
 * @returns Normalized array of document IDs
 * @throws Error if document ID is missing or invalid
 */
export function validateDocumentId(documentId: string | string[]): string[] {
  if (!documentId) {
    throw new Error('Document ID is required')
  }

  const documentIds = Array.isArray(documentId) ? documentId : [documentId]

  if (documentIds.length === 0) {
    throw new Error('At least one document ID must be provided')
  }

  // Validate each document ID
  documentIds.forEach((id) => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error(`Invalid document ID: ${id}`)
    }
  })

  return documentIds
}

/**
 * Validates mutations array
 *
 * @param mutations Array of mutations
 * @throws Error if mutations array is invalid
 */
export function validateMutations(mutations: any[]): void {
  if (!Array.isArray(mutations)) {
    throw new Error('Mutations must be an array')
  }

  if (mutations.length === 0) {
    throw new Error('At least one mutation must be provided')
  }

  // Validate each mutation
  mutations.forEach((mutation, index) => {
    if (!mutation || typeof mutation !== 'object') {
      throw new Error(`Invalid mutation at index ${index}: must be an object`)
    }

    // Check that the mutation has at least one valid operation
    const hasValidOperation = (
      'create' in mutation ||
      'createOrReplace' in mutation ||
      'createIfNotExists' in mutation ||
      'delete' in mutation ||
      'patch' in mutation
    )

    if (!hasValidOperation) {
      throw new Error(
        `Invalid mutation at index ${index}: must contain at least one operation ` +
        '(create, createOrReplace, createIfNotExists, delete, or patch)'
      )
    }
  })
}

/**
 * Validates a document object
 *
 * @param document Document object
 * @throws Error if document is invalid
 */
export function validateDocument(document: Record<string, any>): void {
  if (!document || typeof document !== 'object') {
    throw new Error('Document must be an object')
  }

  if (!document._type) {
    throw new Error('Document must have a _type property')
  }

  // _id is not strictly required as it can be generated
  // but if provided, it should be a string
  if ('_id' in document && (typeof document._id !== 'string' || document._id.trim() === '')) {
    throw new Error('Document _id must be a non-empty string')
  }
}

/**
 * Validates a GROQ query
 *
 * @param query GROQ query string
 * @throws Error if query is invalid
 */
export function validateGroqQuery(query: string): void {
  if (typeof query !== 'string') {
    throw new Error('GROQ query must be a string')
  }

  if (query === '' || query.trim() === '') {
    throw new Error('GROQ query cannot be empty')
  }
}

/**
 * Validates a release ID
 *
 * @param releaseId Release ID
 * @throws Error if release ID is invalid
 */
export function validateReleaseId(releaseId: string): void {
  if (typeof releaseId !== 'string') {
    throw new Error('Release ID must be a string')
  }

  if (releaseId === '' || releaseId.trim() === '') {
    throw new Error('Release ID cannot be empty')
  }
}

/**
 * Validates an embeddings index name
 *
 * @param indexName Embeddings index name
 * @throws Error if index name is invalid
 */
export function validateIndexName(indexName: string): void {
  if (typeof indexName !== 'string') {
    throw new Error('Index name must be a string')
  }

  if (indexName === '' || indexName.trim() === '') {
    throw new Error('Index name cannot be empty')
  }
}
