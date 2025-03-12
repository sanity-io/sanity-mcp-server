// Common TypeScript types for Sanity MCP Server

// Re-export Sanity types from sanity.ts
export * from './sanity.js'

// Import SanityDocument from sanity.ts
import type {SanityDocument} from './sanity.js'

// Sanity client configuration
export interface SanityClientConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token?: string;
  useCdn?: boolean;
}

// Embeddings and search related types
export interface EmbeddingIndex {
  status: 'active' | 'indexing' | 'failed';
  indexName: string;
  projectId: string;
  dataset: string;
  projection: string;
  filter: string;
  createdAt: string;
  updatedAt: string;
  failedDocumentCount: number;
  startDocumentCount: number;
  remainingDocumentCount: number;
  webhookId: string;
}

export interface SearchResult extends SanityDocument {
  score?: number;
  value?: any;
}

export interface SearchResponse {
  hits: SearchResult[];
  total: number;
}

export interface SearchOptions {
  // New properties
  includeMetadata?: boolean;
  limit?: number;
  filter?: string | Record<string, any>;

  // Legacy properties for backward compatibility
  indexName?: string;
  maxResults?: number;
  types?: string[];
  projectId?: string;
  dataset?: string;
}

// Schema related types
export interface SchemaField {
  name: string;
  type: string;
  title?: string;
  description?: string;
  of?: SchemaField[];
  to?: SchemaField[];
  fields?: SchemaField[];
  options?: Record<string, any>;
  validation?: any;
  [key: string]: any;
}

export interface SchemaType {
  name: string;
  type: string;
  [key: string]: any;
}

// Mutation related types
export interface DocumentMutation {
  create?: Record<string, any>;
  createOrReplace?: Record<string, any>;
  createIfNotExists?: Record<string, any>;
  patch?: {
    id: string;
    set?: Record<string, any>;
    setIfMissing?: Record<string, any>;
    unset?: string[];
    insert?: Record<string, any>;
    inc?: Record<string, any>;
    dec?: Record<string, any>;
  };
  delete?: {
    id: string;
  };
}

// Actions related types
export interface Release {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  documents: string[];
}

// Content related types
export interface SubscribeOptions {
  projectId: string;
  dataset: string;
  query: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: Record<string, any>;
}
