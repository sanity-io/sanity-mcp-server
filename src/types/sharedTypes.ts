/**
 * Shared type definitions for tools and controllers
 * 
 * This file contains interfaces that are shared between tool definitions
 * and controller implementations to ensure type safety across the codebase.
 */

import { z } from 'zod';
import { Mutation } from '../controllers/mutate.js';
import { SanityDocument, PatchOperations, SanityMutationResult } from './sanity.js';
import { SchemaType, SchemaField, SearchOptions, SearchResponse } from './index.js';

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

export interface GroqQueryResult {
  query: string;
  results: SanityDocument | SanityDocument[];
  count: number;
  verification?: {
    performed: boolean;
    originalCount: number;
    verifiedCount: number;
  };
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