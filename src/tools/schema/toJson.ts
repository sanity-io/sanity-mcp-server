/**
 * Convert an object or array to a JSON string
 */
export function toJsonString(arg: any | any[]) {
  return JSON.stringify(arg, null, 1);
}
