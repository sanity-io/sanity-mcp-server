/**
 * Type definitions for Sanity-related objects and operations
 */
import type {
  SanityClient as OriginalSanityClient
} from '@sanity/client'

/**
 * Sanity Query Parameters
 */
export interface SanityQueryParams {
  [key: string]: string | number | boolean | string[] | number[] | SanityQueryParams;
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
 * Sanity Patch interface
 */
export interface SanityPatch {
  set(attributes: Record<string, any>): SanityPatch;
  setIfMissing(attributes: Record<string, any>): SanityPatch;
  replace(selector: string, value: any): SanityPatch;
  inc(attributes: Record<string, number>): SanityPatch;
  dec(attributes: Record<string, number>): SanityPatch;
  insert(position: 'before' | 'after' | 'replace', selector: string, items: any[] | any): SanityPatch;
  unset(attributes: string | string[]): SanityPatch;
  diffMatchPatch(attributes: Record<string, string>): SanityPatch;
  ifRevisionId(id: string): SanityPatch;
  commit(): Promise<SanityMutationResult>;
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
  commit(): Promise<SanityMutationResult>;
}

/**
 * Extended SanityClient interface with the specific methods used in our application
 */
export type SanityClient = OriginalSanityClient;

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
  id?: string;
  document?: Record<string, any>;
}

/**
 * Sanity Mutation Result interface
 */
export interface SanityMutationResult {
  documentId?: string;
  transactionId?: string;
  results?: Array<{
    id: string;
    operation: string;
  }>;
  id?: string;
  operation?: string;
  [key: string]: any; // Allow for other properties
}

/**
 * Sanity Error interface
 */
export interface SanityError {
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
  before?: string;
  after?: string;
  replace?: string;
  at?: string; // For backward compatibility
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
  ifRevisionID?: string;
}
