import {XMLBuilder} from 'fast-xml-parser'

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
    ignoreAttributes: false,
    processEntities: false,
  })

  const contextString = builder.build(formattedObject)

  return `${message}: \n${contextString}\n`
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

/**
 * Pluralizes a string based on a count.
 * Returns singular form for count of 1, plural form otherwise.
 */
export function pluralize(n: number | unknown[], singular: string, plural?: string): string {
  const num = Array.isArray(n) ? n.length : n
  return num === 1 ? singular : plural || `${singular}s`
}
