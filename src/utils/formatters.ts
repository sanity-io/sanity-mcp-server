import {XMLBuilder} from 'fast-xml-parser'
import type {DocumentLike} from '../types/sanity.js'

/**
 * Formats a response by combining a message with structured data.
 * Converts the provided object to XML format and appends the message.
 */
export function formatResponse(
  message: string | null,
  object: Record<string, unknown> = {},
): string {
  const formattedObject: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(object)) {
    if (!value) continue
    formattedObject[key] = value
  }

  const builder = new XMLBuilder({
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
  })

  const contextString = builder.build(formattedObject)

  return `${contextString}\n${message}`.trim()
}

/**
 * Strips the document for LLM output to avoid returning overly large documents.
 */
export const truncateDocumentForLLMOutput = (document: DocumentLike): DocumentLike => {
  if (!document) return document

  const strippedDoc = {...document}

  // Process all keys in the document
  for (const key of Object.keys(strippedDoc)) {
    const value = strippedDoc[key]

    // Handle long strings by truncating them
    if (typeof value === 'string' && value.length > 160) {
      strippedDoc[key] = `${value.slice(0, 160)}...`
    }

    // Keep only the first item in arrays to save space
    if (Array.isArray(value)) {
      strippedDoc[key] =
        value.length > 0 ? [value[0], `+ ${value.length - 1} more array items`] : []
    }
  }

  return strippedDoc
}

/**
 * Ensures that a value is an array.
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}
