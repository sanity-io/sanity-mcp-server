/**
 * Type definitions for Sanity-related content and documents
 */
export type ContentValue =
  | string
  | number
  | boolean
  | SanityReference
  | Date
  | null
  | undefined
  | ContentObject
  | ContentArray

export interface ContentObject {
  [key: string]: ContentValue
}

export type ContentArray = Array<ContentValue>

export interface SanityReference {
  _ref: string
  _weak?: boolean
}

export interface SanityDocument {
  _id: string
  _type: string
  _rev?: string
  _createdAt?: string
  _updatedAt?: string
  [key: string]: ContentValue
}

export interface SanityMutationResult {
  documentId?: string
  transactionId?: string
  results?: Array<{
    id: string
    operation: string
  }>
}

export interface EmbeddingsIndex {
  status: string
  indexName: string
  projectId: string
  dataset: string
  projection: string
  filter: string
  createdAt: string
  updatedAt: string
  failedDocumentCount: number
  startDocumentCount: number
  remainingDocumentCount: number
  webhookId: string
}

export interface EmbeddingsQueryResultItem {
  score: number
  value: {
    documentId: string
    type: string
  }
}
