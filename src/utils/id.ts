const ALLOWED_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Generates a valid Sanity document ID
 *
 * Creates an ID that follows Sanity's requirements:
 * - Contains only a-zA-Z0-9 characters
 * - Maximum 128 characters
 */
export function generateSanityId(length = 8, prefix = ''): string {
  // Ensure length is within valid range, accounting for prefix length
  const prefixLength = prefix.length
  const availableLength = 128 - prefixLength
  const finalLength = Math.min(Math.max(1, length), availableLength)

  // Generate random ID of specified length
  let id = prefix
  for (let i = 0; i < finalLength; i++) {
    id += ALLOWED_CHARS.charAt(Math.floor(Math.random() * ALLOWED_CHARS.length))
  }

  return id
}
