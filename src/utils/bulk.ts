type BulkResult<T> =
  | {success: true; data: T; item: unknown}
  | {success: false; error: string; item: unknown}

type BulkOperationSummary = {
  total: number
  successful: number
  failed: number
}

export type BulkOperationResponse<T> = {
  results: BulkResult<T>[]
  summary: BulkOperationSummary
  successfulResults: T[]
  failedResults: Array<{error: string; item: unknown}>
}

/**
 * Processes bulk operations with automatic error handling and cleaner results
 * @param items Array of items to process
 * @param processor Function that processes each item and returns the result
 * @returns Object with results, summary, and convenience arrays for successful/failed operations
 */
export async function processBulkOperation<TItem, TResult>(
  items: TItem[],
  processor: (item: TItem) => Promise<TResult>,
): Promise<BulkOperationResponse<TResult>> {
  const settledResults = await Promise.allSettled(
    items.map(async (item) => ({item, result: await processor(item)})),
  )

  const results: BulkResult<TResult>[] = []
  const successfulResults: TResult[] = []
  const failedResults: Array<{error: string; item: unknown}> = []

  for (const settled of settledResults) {
    if (settled.status === 'fulfilled') {
      const {item, result} = settled.value
      const successResult = {success: true as const, data: result, item}
      results.push(successResult)
      successfulResults.push(result)
    } else {
      const error = settled.reason instanceof Error ? settled.reason.message : 'Unknown error'
      const item = items[results.length + failedResults.length]
      const failedResult = {success: false as const, error, item}
      results.push(failedResult)
      failedResults.push({error, item})
    }
  }

  const summary = {
    total: items.length,
    successful: successfulResults.length,
    failed: failedResults.length,
  }

  return {
    results,
    summary,
    successfulResults,
    failedResults,
  }
}

/**
 * Creates a standardized success/failure message for bulk operations
 * @param operationName Name of the operation (e.g., "documents", "versions")
 * @param summary Summary of the operation
 * @param isAsync Whether operations were run asynchronously
 * @returns Formatted message string
 */
export function createBulkOperationMessage(
  operationName: string,
  summary: BulkOperationSummary,
  isAsync = false,
): string {
  const action = isAsync ? 'Initiated' : 'Processed'
  const suffix = isAsync ? 'in background' : ''

  return `${action} ${summary.total} ${operationName}${suffix ? ` ${suffix}` : ''}: ${summary.successful} successful, ${summary.failed} failed`
}
