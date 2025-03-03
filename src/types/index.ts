// Common TypeScript types for Sanity MCP Server

import { SanityClient } from '@sanity/client';

// Sanity related types
export interface SanityDocument {
  _id: string;
  _type: string;
  _rev?: string;
  _createdAt?: string;
  _updatedAt?: string;
  [key: string]: any;
}

// Sanity client configuration
export interface SanityClientConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token?: string;
  useCdn?: boolean;
}

// Search related types
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

export interface SearchResult {
  score: number;
  value: {
    documentId: string;
    type: string;
    [key: string]: any;
  };
}

export interface SearchResponse {
  hits: SearchResult[];
  total: number;
}

export interface SearchOptions {
  indexName: string;
  maxResults?: number;
  types?: string[];
  projectId?: string;
  dataset?: string;
}

// Schema related types
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

// Portable text operation
export interface PortableTextOperation {
  type: 'insert' | 'replace' | 'remove';
  position: 'beginning' | 'end' | 'at';
  atIndex?: number;
  value?: any;
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
