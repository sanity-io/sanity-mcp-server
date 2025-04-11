import {z} from 'zod'

/**
 * Converts a string path to an array of path segments
 *
 * @param path - The string path to convert
 * @returns An array of path segments
 */
export function stringToPath(path: string): Array<string | {_key: string}> {
  if (!path) {
    throw new Error('Path is required')
  }

  const segments: Array<string | {_key: string}> = []
  let current = ''
  let i = 0

  while (i < path.length) {
    // Handle square bracket notation
    if (path[i] === '[') {
      // If we have collected characters, add them as a segment
      if (current) {
        segments.push(current)
        current = ''
      }

      i++ // Skip opening bracket

      // Handle _key lookup
      if (path.slice(i, i + 5) === '_key==' && path[i + 5] === '"') {
        i += 6 // Skip '_key=="'
        let key = ''
        while (i < path.length && path[i] !== '"') {
          key += path[i++]
        }
        i += 2 // Skip closing quote and bracket

        segments.push({_key: key})
      } else {
        // Skip to end of bracket
        while (i < path.length && path[i] !== ']') {
          i++
        }
        i++ // Skip closing bracket
      }
    }
    // Handle dot notation
    else if (path[i] === '.') {
      if (current) {
        segments.push(current)
        current = ''
      }
      i++
    }
    // Handle quoted property names
    else if (path[i] === "'" || path[i] === '"') {
      const quote = path[i++]
      let prop = ''
      while (i < path.length && path[i] !== quote) {
        prop += path[i++]
      }
      i++ // Skip closing quote
      segments.push(prop)

      // Skip closing bracket if it exists (for ['prop'] notation)
      if (i < path.length && path[i] === ']') {
        i++
      }
    }
    // Collect regular characters
    else {
      current += path[i++]
    }
  }

  // Add the final segment if any
  if (current) {
    segments.push(current)
  }

  // Validate result
  if (segments.length === 0) {
    throw new Error(`Invalid path: ${path}`)
  }

  return segments
}

export const pathSchema = z
  .array(z.union([z.string().min(1), z.object({_key: z.string().min(1)})]))
  .min(1)
