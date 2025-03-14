/**
 * API Response Types
 *
 * This file defines common response types used across the API
 */

/**
 * Base API response interface
 * All API responses should include at least a success flag and a message
 */
export interface ApiResponse {
  success: boolean;
  message: string;
}

/**
 * Generic API success response
 * Extends ApiResponse with a generic data type for the resul
 */
export interface ApiSuccessResponse<T> extends ApiResponse {
  success: true;
  result: T;
}

/**
 * API error response
 * Extends ApiResponse with error details
 */
export interface ApiErrorResponse extends ApiResponse {
  success: false;
  error?: {
    code?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Document operation response
 * Used for responses to operations on individual documents
 */
export interface DocumentResponse extends ApiResponse {
  documentId?: string;
  documentIds?: string[];
}

/**
 * Query result response
 * Used for responses to GROQ queries
 */
export interface QueryResponse<T> {
  query: string;
  results: T;
  count: number;
}

/**
 * Search result response
 * Used for responses to search operations
 */
export interface SearchResponse<T> {
  query: string;
  hits: T[];
  total: number;
}

/**
 * List response
 * Used for responses that return a list of items
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
}
