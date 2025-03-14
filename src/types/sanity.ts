/**
 * Type definitions for Sanity-related objects and operations
 */
import type {
  SanityClient as OriginalSanityClien
} from '@sanity/client'

/**
 * Sanity Query Parameters
 */
export interface SanityQueryParams {
  [key: string]: string | number | boolean | string[] | number[] | SanityQueryParams |
    ((item: unknown) => boolean) | Record<string, unknown> | undefined;
  useCdn?: boolean;
  token?: string;
  includeDrafts?: boolean;
  filter?: (item: unknown) => boolean;
  limit?: number;
  params?: Record<string, unknown>;
}

/**
 * Content Value type
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
  | ContentArray;

/**
 * Content Object type
 */
export interface ContentObject {
  [key: string]: ContentValue;
}

/**
 * Content Array type
 */
export interface ContentArray extends Array<ContentValue> {}

/**
 * Sanity Reference interface
 */
export interface SanityReference {
  _ref: string;
  _weak?: boolean;
}

/**
 * Sanity Image Asset interface
 */
export interface SanityImageAsset {
  _id: string;
  _type: 'sanity.imageAsset';
  url: string;
  metadata: {
    dimensions: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    lqip?: string;
    hasAlpha?: boolean;
    isOpaque?: boolean;
  };
}

/**
 * Sanity File Asset interface
 */
export interface SanityFileAsset {
  _id: string;
  _type: 'sanity.fileAsset';
  url: string;
  originalFilename?: string;
  extension?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Sanity Document interface with improved typing
 */
export interface SanityDocument {
  _id: string;
  _type: string;
  _rev?: string;
  _createdAt?: string;
  _updatedAt?: string;
  [key: string]: any; // Reverted back to any for simplicity
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
  unset(attributes: string[]): SanityPatch;
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
export type SanityClient = OriginalSanityClien;

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
  unset?: string[];
  inc?: Record<string, number>;
  dec?: Record<string, number>;
  insert?: InsertOperation;
  diffMatchPatch?: Record<string, string>;
  ifRevisionID?: string;
}
