/**
 * Resolves the schema ID for a given workspace.
 */
export function resolveSchemaId(workspaceName = 'default'): string {
  return `_.schemas:${workspaceName}`
}
