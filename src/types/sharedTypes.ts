/**
 * Shared type definitions for tools and controllers
 *
 * This file contains interfaces that are shared between tool definitions
 * and controller implementations to ensure type safety across the codebase.
 */

import {z} from 'zod'

import type {Mutation} from '../controllers/mutate.js'
import type {SchemaField, SchemaType, SearchOptions} from './index.js'
import type {PatchOperations, SanityActionResult, SanityDocument, SanityMutationResult} from './sanity.js'

/**
 * Interface for the result of document mutations
 */
export interface MutateDocumentsResult {
  success: boolean;
  message: string;
  result: Record<string, any>;
  documents?: SanityDocument[];
}

/**
 * Common base interface for projectId and dataset parameters
 */
export interface ProjectDatasetParams {
  projectId?: string;
  dataset?: string;
}

/**
 * Interface for document mutation parameters
 */
export interface MutateDocumentsParams extends ProjectDatasetParams {
  mutations: Mutation[];
  returnDocuments?: boolean;
  options?: {
    returnDocuments?: boolean;
    visibility?: 'sync' | 'async' | 'deferred';
  };
}

/**
 * Interface for create document parameters
 */
export interface CreateDocumentParams extends ProjectDatasetParams {
  document: Record<string, any>;
  options?: {
    returnDocuments?: boolean;
    visibility?: 'sync' | 'async' | 'deferred';
  };
}

/**
 * Interface for update document parameters
 */
export interface UpdateDocumentParams extends ProjectDatasetParams {
  documentId: string;
  document: Record<string, any>;
  options?: {
    returnDocuments?: boolean;
    visibility?: 'sync' | 'async' | 'deferred';
  };
}

/**
 * Interface for patch document parameters
 */
export interface PatchDocumentParams extends ProjectDatasetParams {
  documentId: string;
  patch: PatchOperations;
  options?: {
    returnDocuments?: boolean;
    visibility?: 'sync' | 'async' | 'deferred';
  };
}

/**
 * Interface for delete document parameters
 */
export interface DeleteDocumentParams extends ProjectDatasetParams {
  documentId: string;
  options?: {
    visibility?: 'sync' | 'async' | 'deferred';
  };
}

/**
 * Type to derive Zod schema from TypeScript interface
 * This helps ensure schema validation matches TypeScript types
 */
export type ZodSchemaFromInterface<T> = {
  [K in keyof T]: T[K] extends object
    ? z.ZodObject<ZodSchemaFromInterface<T[K]>>
    : T[K] extends Array<infer U>
    ? z.ZodArray<z.ZodType<U>>
    : T[K] extends string
    ? z.ZodString
    : T[K] extends number
    ? z.ZodNumber
    : T[K] extends boolean
    ? z.ZodBoolean
    : T[K] extends undefined
    ? z.ZodUndefined
    : T[K] extends string | undefined
    ? z.ZodOptional<z.ZodString>
    : T[K] extends number | undefined
    ? z.ZodOptional<z.ZodNumber>
    : T[K] extends boolean | undefined
    ? z.ZodOptional<z.ZodBoolean>
    : T[K] extends Record<string, any> | undefined
    ? z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>
    : z.ZodAny;
};

/**
 * Generic interface for tool handler functions
 * This provides type safety between tool definition and implementation
 */
export interface ToolHandler<TParams, TResult> {
  (params: TParams): Promise<TResult>;
}

/**
 * Schema-related shared interfaces
 */

export interface SchemaParams extends ProjectDatasetParams {
  projectId: string;
  dataset: string;
}

export interface GetSchemaParams extends SchemaParams {}

export interface ListSchemaTypesParams extends SchemaParams {
  allTypes?: boolean;
}

export interface GetTypeSchemaParams extends SchemaParams {
  typeName: string;
}

export interface SchemaTypeDetails extends SchemaType {
  fields?: SchemaField[];
  [key: string]: any;
}

/**
 * GROQ-related shared interfaces
 */

export interface GroqQueryParams extends ProjectDatasetParams {
  query: string;
  params?: Record<string, any>;
}

export interface GetDocumentParams extends ProjectDatasetParams {
  documentId: string | string[];
}

/**
 * Interface for GROQ query results
 */
export interface GroqQueryResult {
  query: string;
  results: SanityDocument | SanityDocument[];
  count: number;
}

export interface GroqSpecResult {
  specification: Record<string, any>;
  source: string;
}

export interface SearchParams extends ProjectDatasetParams {
  query: string;
  indexName?: string;
  limit?: number;
  filter?: string | Record<string, any>;
  options?: SearchOptions;
}

/**
 * Actions-related shared interfaces
 */

export interface DocumentIdParam extends ProjectDatasetParams {
  documentId: string | string[];
}

export interface ReleaseDocumentIdParam extends ProjectDatasetParams {
  releaseId: string;
  documentId: string | string[];
}

export interface ActionResult {
  success: boolean;
  message: string;
  documentId?: string;
  documentIds?: string[];
  result: SanityActionResult | SanityMutationResult;
}

/**
 * Interface for embeddings index listing parameters
 */
export interface ListEmbeddingsIndicesParams extends ProjectDatasetParams {}

/**
 * Interface for embeddings index in tool responses
 * Simplifies the full EmbeddingIndex for tool usage
 */
export interface EmbeddingsIndex {
  id: string;
  name: string;
  status: string;
  documentCount?: number;
  errorMessage?: string;
}

/**
 * Interface for simplified schema type
 */
export interface SimpleSchemaType {
  name: string;
  title: string;
  type: string;
}

/**
 * Interface for releases listing parameters
 */
export interface ListReleasesParams extends ProjectDatasetParams {
  includeArchived?: boolean;
}

/**
 * Interface for simplified release
 */
export interface SimpleRelease {
  id: string;
  title: string;
  status: string;
}

/**
 * Projects-related shared interfaces
 */

export interface Project {
  id: string;
  displayName: string;
  studioHost?: string;
  externalStudioHost?: string;
  organizationId?: string;
}

export interface Organization {
  organizationId: string;
  organizationName: string;
  projects: {
    id: string;
    displayName: string;
    studioHost?: string;
    externalStudioHost?: string;
  }[];
}

export interface Studio {
  type: 'sanity-hosted' | 'external';
  url: string;
}

export interface StudiosResult {
  studios: Studio[];
  message?: string;
}

export interface ListStudiosParams {
  projectId: string;
}

/**
 * Releases-related shared interfaces
 */

export interface CreateReleaseParams extends ProjectDatasetParams {
  title: string;
  description?: string;
}

export interface UpdateReleaseParams extends ProjectDatasetParams {
  releaseId: string;
  title?: string;
  description?: string;
}

export interface ReleaseIdParam extends ProjectDatasetParams {
  releaseId: string;
}

export interface AddDocumentToReleaseParams extends ReleaseIdParam {
  documentId: string;
}

export interface RemoveDocumentFromReleaseParams extends ReleaseIdParam {
  documentId: string;
}

export interface PublishReleaseParams extends ReleaseIdParam {
  scheduledAt?: string;
}

/**
 * Embeddings-related shared interfaces
 */

export interface SemanticSearchParams extends ProjectDatasetParams {
  query: string;
  indexName: string;
  maxResults?: number;
  types?: string | string[];
}
