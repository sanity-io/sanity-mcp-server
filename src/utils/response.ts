import {formatResponse} from './formatters.js'
import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(message: string, data?: Record<string, unknown>) {
  return {
    content: [
      {
        type: 'text',
        text: data ? formatResponse(message, data) : message,
      },
    ],
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `Error: ${errorMessage}`,
      },
    ],
  }
}

/**
 * Higher-order function that wraps tool handlers with standardized error handling
 */
export function withErrorHandling<T extends Record<string, unknown>>(
  handler: (params: T, extra?: RequestHandlerExtra) => Promise<any>,
  errorPrefix = 'Error',
): (params: T, extra?: RequestHandlerExtra) => Promise<any> {
  return async (params: T, extra?: RequestHandlerExtra) => {
    try {
      return await handler(params, extra)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `${errorPrefix}: ${errorMessage}`,
          },
        ],
      }
    }
  }
}
