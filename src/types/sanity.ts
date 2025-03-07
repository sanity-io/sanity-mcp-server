/**
 * Type definitions for Sanity-related objects and operations
 */
import { SanityClient as OriginalSanityClient } from '@sanity/client';

/**
 * Extended SanityClient interface with the specific methods used in our application
 */
export interface SanityClient extends OriginalSanityClient {
  // Document operations
  getDocument(id: string): Promise<Record<string, any> | null>;
  create(doc: Record<string, any>): Promise<Record<string, any>>;
  createOrReplace(doc: Record<string, any>): Promise<Record<string, any>>;
  createIfNotExists(doc: Record<string, any>): Promise<Record<string, any>>;
  patch(id: string): SanityPatch;
  delete(id: string): Promise<Record<string, any>>;
  
  // Transaction operations
  transaction(): SanityTransaction;
  
  // Query operations
  fetch<T = any>(query: string, params?: Record<string, any>): Promise<T>;
}

/**
 * Sanity Transaction interface
 */
export interface SanityTransaction {
  create(doc: Record<string, any>): SanityTransaction;
  createOrReplace(doc: Record<string, any>): SanityTransaction;
  createIfNotExists(doc: Record<string, any>): SanityTransaction;
  delete(documentId: string): SanityTransaction;
  patch(documentId: string, patchSpec: Record<string, any>): SanityTransaction;
  patch(documentId: string, patches: SanityPatch): SanityTransaction;
  commit(): Promise<{ results: Array<{ id: string, operation: string }> }>;
}

/**
 * Sanity Patch interface
 */
export interface SanityPatch {
  set(attributes: Record<string, any>): SanityPatch;
  setIfMissing(attributes: Record<string, any>): SanityPatch;
  unset(attributes: string[]): SanityPatch;
  inc(attributes: Record<string, number>): SanityPatch;
  dec(attributes: Record<string, number>): SanityPatch;
  insert(position: string, path: string, items: any[]): SanityPatch;
  diffMatchPatch(attributes: Record<string, string>): SanityPatch;
  commit(): Promise<Record<string, any>>;
}

/**
 * Sanity Document interface
 */
export interface SanityDocument {
  _id: string;
  _type: string;
  _rev?: string;
  _createdAt?: string;
  _updatedAt?: string;
  [key: string]: any;
}

/**
 * Sanity Draft Document interface
 */
export interface SanityDraftDocument extends SanityDocument {
  _id: string; // Will always start with 'drafts.'
}

/**
 * Sanity Action Result interface
 */
export interface SanityActionResult {
  transactionId: string;
  results: Array<{
    id: string;
    document?: Record<string, any>;
  }>;
}

/**
 * Sanity Mutation Result interface
 */
export interface SanityMutationResult {
  documentId: string;
  transactionId?: string;
  results?: Array<{
    id: string;
    operation: string;
  }>;
}

/**
 * Sanity Error interface
 */
export interface SanityError extends Error {
  statusCode?: number;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Release options interface
 */
export interface ReleaseOptions {
  description?: string;
  releaseType?: 'asap' | 'scheduled';
  intendedPublishAt?: string;
}

/**
 * Release document interface
 */
export interface ReleaseDocument {
  versionId: string;
  documentId: string;
  type: string;
  title: string;
}

/**
 * Insert operation interface for array mutations
 */
export interface InsertOperation {
  items: any[] | any;
  position: 'before' | 'after' | 'replace';
  at: string;
}

/**
 * Patch operation interface for document patching
 */
export interface PatchOperations {
  set?: Record<string, any>;
  setIfMissing?: Record<string, any>;
  unset?: string | string[];
  inc?: Record<string, number>;
  dec?: Record<string, number>;
  insert?: InsertOperation;
  diffMatchPatch?: Record<string, string>;
}
