/**
 * Convert an object or array to a JSON string
 */
export function toJsonString(arg: unknown | unknown[]) {
  return JSON.stringify(arg, null, 1)
}
