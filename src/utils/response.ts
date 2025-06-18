import type {ServerNotification, ServerRequest} from '@modelcontextprotocol/sdk/types.js'
import {isWithinTokenLimit} from 'gpt-tokenizer'
import type {THIS_IS_FINE} from '../types/any.js'
import {ensureArray, formatResponse} from './formatters.js'
import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'
import {tokenLimit} from './tokens.js'
import type {Checkpoint} from '../types/checkpoint.js'

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  message: string,
  data?: Record<string, unknown>,
  checkpoints?: Checkpoint | Checkpoint[],
) {
  const text = data ? formatResponse(message, data) : message
  const withinTokenLimit = isWithinTokenLimit(text, tokenLimit)

  if (!withinTokenLimit) {
    throw new Error(
      'Response exceeds token limit, consider tweaking your tool arguments to reduce output size!',
    )
  }

  return {
    checkpoints: ensureArray(checkpoints),
    content: [
      {
        type: 'text',
        text,
      },
    ],
  }
}

/**
 * Higher-order function that wraps tool handlers with standardized error handling
 */
export function withErrorHandling<T extends Record<string, unknown>>(
  handler: (
    params: T,
    extra?: RequestHandlerExtra<ServerRequest, ServerNotification>,
  ) => Promise<THIS_IS_FINE>,
  errorPrefix = 'Error',
): (
  params: T,
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>,
) => Promise<THIS_IS_FINE> {
  return async (params: T, extra?: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
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
