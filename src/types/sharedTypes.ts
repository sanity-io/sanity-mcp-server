/**
 * Shared type definitions for tools and controllers
 * 
 * This file contains interfaces that are shared between tool definitions
 * and controller implementations to ensure type safety across the codebase.
 */

import { z } from 'zod';
import { Mutation } from '../controllers/mutate.js';
import { SanityDocument, PatchOperations, SanityMutationResult } from './sanity.js';

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