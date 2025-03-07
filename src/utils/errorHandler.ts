import { logger } from './logger.js';

interface ErrorOptions {
  context?: Record<string, unknown>;
  source?: string;
  originalError?: Error | unknown;
  code?: string;
}

/**
 * Centralized error handling utility
 * 
 * @param message - The error message
 * @param options - Additional error context and options
 * @returns A standardized error object with additional context
 */
export function handleError(message: string, options: ErrorOptions = {}): Error {
  const { context, source, originalError, code } = options;
  
  // Format as a JSON-friendly error object for structured logging
  const errorObject = {
    message,
    code: code || 'UNKNOWN_ERROR',
    source: source || 'server',
    timestamp: new Date().toISOString(),
    ...(context && { context }),
    ...(originalError instanceof Error && {
      originalError: {
        message: originalError.message,
        name: originalError.name,
        stack: originalError.stack
      }
    })
  };
  
  // Log the structured error
  logger.error('Error occurred:', errorObject);
  
  // Create an error object with a descriptive message
  const errorMessage = formatErrorMessage(message, originalError);
  const error = new Error(errorMessage);
  
  // Add additional properties to the error object
  Object.assign(error, { 
    code, 
    context, 
    source,
    timestamp: errorObject.timestamp,
    originalError
  });
  
  return error;
}

/**
 * Formats a consistent error message combining the primary message and original error
 */
function formatErrorMessage(message: string, originalError?: unknown): string {
  if (!originalError) {
    return message;
  }
  
  if (originalError instanceof Error) {
    return `${message}: ${originalError.message}`;
  }
  
  try {
    return `${message}: ${JSON.stringify(originalError)}`;
  } catch (e) {
    return `${message}: [Unstringifiable Error]`;
  }
}

/**
 * Creates a typed error response function for specific domains
 * 
 * @param domain - The domain/module this error handler is for (e.g. 'documents', 'releases')
 * @returns A domain-specific error handler function
 */
export function createDomainErrorHandler(domain: string) {
  return (message: string, options: Omit<ErrorOptions, 'source'> = {}): Error => {
    return handleError(message, { ...options, source: domain });
  };
}

/**
 * Common error codes that can be used across the application
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Request errors
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  
  // Sanity API errors
  SANITY_API_ERROR: 'SANITY_API_ERROR',
  SANITY_MUTATION_ERROR: 'SANITY_MUTATION_ERROR',
  SANITY_QUERY_ERROR: 'SANITY_QUERY_ERROR',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT'
};

export default handleError; 