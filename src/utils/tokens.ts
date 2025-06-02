import {countTokens} from 'gpt-tokenizer'
import {env} from '../config/env.js'

export const tokenLimit = env.data?.MAX_TOOL_TOKEN_OUTPUT || 4096 // Default is defined in env schema

export interface TokenLimitResult<T> {
  selectedItems: T[]
  formattedItems: string[]
  tokensUsed: number
  totalAvailable: number
}

/**
 * Limits a collection of items based on token count, selecting as many items as possible
 * without exceeding the specified token limit.
 */
export function limitByTokens<T>(
  items: T[],
  formatter: (item: T, index: number) => string,
  limit: number = tokenLimit,
  requestedLimit?: number,
): TokenLimitResult<T> {
  let runningTokens = 0
  const selectedItems: T[] = []
  const formattedItems: string[] = []

  const maxItems = requestedLimit ? Math.min(items.length, requestedLimit) : items.length

  for (let i = 0; i < maxItems; i++) {
    const item = items[i]
    const formattedItem = formatter(item, i)
    const itemTokens = countTokens(formattedItem)

    // Add separator tokens if not the first item
    const separatorTokens = selectedItems.length > 0 ? countTokens('\n') : 0

    if (runningTokens + itemTokens + separatorTokens > limit && selectedItems.length > 0) {
      break
    }

    selectedItems.push(item)
    formattedItems.push(formattedItem)
    runningTokens += itemTokens + separatorTokens
  }

  return {
    selectedItems,
    formattedItems,
    tokensUsed: runningTokens,
    totalAvailable: items.length,
  }
}
