import type {THIS_IS_FINE} from '../types/any.js'
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
 * Higher-order function that wraps tool handlers with standardized error handling
 */
export function withErrorHandling<T extends Record<string, unknown>>(
  handler: (params: T, extra?: RequestHandlerExtra) => Promise<THIS_IS_FINE>,
  errorPrefix = 'Error',
): (params: T, extra?: RequestHandlerExtra) => Promise<THIS_IS_FINE> {
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
