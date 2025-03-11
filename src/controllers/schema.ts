import {readFile} from 'fs/promises'

import config from '../config/config.js'
import type {SchemaField, SchemaType} from '../types/index.js'
import logger from '../utils/logger.js'

interface SchemaTypeDetails extends SchemaType {
  fields?: SchemaField[];
  [key: string]: any;
}

/**
 * Gets the full schema for a Sanity project and dataset
 *
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name (default: 'production')
 * @returns The schema object
 */
export async function getSchema(projectId: string, dataset: string = 'production'): Promise<SchemaTypeDetails[]> {
  try {
    const schemaPath = config.getSchemaPath(projectId, dataset)

    try {
      const schemaData = await readFile(schemaPath, 'utf-8')
      return JSON.parse(schemaData)
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        throw new Error(
          `Schema file not found for project ${projectId} and dataset ${dataset}. ` +
          'Please run \'npx sanity@latest schema extract\' in your Sanity studio and ' +
          `save the output to ${schemaPath}`
        )
      }
      throw readError
    }
  } catch (error: any) {
    logger.error(`Error getting schema for ${projectId}/${dataset}:`, error)
    throw new Error(`Failed to get schema: ${error.message}`)
  }
}

/**
 * Gets the schema definition for a specific type
 *
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name (default: 'production')
 * @param typeName - The type name
 * @param options - Additional options for retrieving the schema
 * @returns The schema definition for the type
 */
export async function getSchemaForType(
  projectId: string,
  dataset: string = 'production',
  typeName: string,
  options: {
    includeReferences?: boolean;
  } = {}
): Promise<SchemaTypeDetails> {
  try {
    // Get the full schema
    const schema = await getSchema(projectId, dataset)

    // Find the specific type
    const typeSchema = schema.find((type) => type.name === typeName)

    if (!typeSchema) {
      throw new Error(`Type ${typeName} not found in schema`)
    }

    // If references are not needed, return just the type schema
    if (!options.includeReferences) {
      return typeSchema
    }

    // Find referenced types
    const referencedTypes = findReferencedTypes(typeSchema, schema)

    // Add references to the type schema (for backwards compatibility)
    return {
      ...typeSchema,
      references: referencedTypes
    }
  } catch (error: any) {
    logger.error(`Error getting schema for type ${typeName}:`, error)
    throw new Error(`Failed to get schema for type ${typeName}: ${error.message}`)
  }
}

/**
 * Process a reference field and add referenced types to the collection
 */
function processReferenceField(
  refField: SchemaField,
  allTypes: SchemaTypeDetails[],
  referencedTypes: SchemaTypeDetails[],
  processedTypes: Set<string>
) {
  if (!refField.to) {
    return
  }

  const refTypes = Array.isArray(refField.to) ? refField.to : [refField.to]

  for (const refType of refTypes) {
    const typeName = typeof refType === 'string' ? refType : refType.type
    const referencedType = allTypes.find((t) => t.name === typeName)

    if (referencedType && !processedTypes.has(referencedType.name)) {
      referencedTypes.push(referencedType)
      processedTypes.add(referencedType.name)
      // Recursively process the referenced type's fields
      processFields(referencedType, allTypes, referencedTypes, processedTypes)
    }
  }
}

/**
 * Process a single array type item and add referenced types to the collection
 */
function processArrayTypeItem(
  arrayType: SchemaField,
  allTypes: SchemaTypeDetails[],
  referencedTypes: SchemaTypeDetails[],
  processedTypes: Set<string>
) {
  if (arrayType.type === 'reference' && arrayType.to) {
    // Process references within arrays
    processReferenceField(arrayType, allTypes, referencedTypes, processedTypes)
  } else {
    // Handle other array types that aren't references
    const embeddedType = allTypes.find((t) => t.name === arrayType.type)
    if (embeddedType && !processedTypes.has(embeddedType.name)) {
      referencedTypes.push(embeddedType)
      processedTypes.add(embeddedType.name)
      processFields(embeddedType, allTypes, referencedTypes, processedTypes)
    }
  }
}

/**
 * Process an array field and add referenced types to the collection
 */
function processArrayField(
  arrayField: SchemaField,
  allTypes: SchemaTypeDetails[],
  referencedTypes: SchemaTypeDetails[],
  processedTypes: Set<string>
) {
  if (!arrayField.of) {
    return
  }

  const arrayTypes = Array.isArray(arrayField.of) ? arrayField.of : [arrayField.of]

  for (const arrayType of arrayTypes) {
    processArrayTypeItem(arrayType, allTypes, referencedTypes, processedTypes)
  }
}

/**
 * Process a single field to find references
 */
function processField(
  field: SchemaField,
  allTypes: SchemaTypeDetails[],
  referencedTypes: SchemaTypeDetails[],
  processedTypes: Set<string>
) {
  // Check for reference types
  if (field.type === 'reference' && field.to) {
    processReferenceField(field, allTypes, referencedTypes, processedTypes)
  }

  // Check for array types
  else if (field.type === 'array' && field.of) {
    processArrayField(field, allTypes, referencedTypes, processedTypes)
  }
}

/**
 * Process a type's fields to find references
 */
function processFields(
  type: SchemaTypeDetails,
  allTypes: SchemaTypeDetails[],
  referencedTypes: SchemaTypeDetails[],
  processedTypes: Set<string>
) {
  // Skip if no fields or not an array
  if (!type.fields || !Array.isArray(type.fields)) {
    return
  }

  // Process each field
  for (const field of type.fields) {
    processField(field, allTypes, referencedTypes, processedTypes)
  }
}

/**
 * Find types that are referenced by a given type
 *
 * @param typeSchema - The type to check for references
 * @param allTypes - All available types in the schema
 * @returns Array of referenced types
 */
function findReferencedTypes(typeSchema: SchemaTypeDetails, allTypes: SchemaTypeDetails[]): SchemaTypeDetails[] {
  const referencedTypes: SchemaTypeDetails[] = []
  const processedTypes = new Set<string>()

  // Mark starting type as processed
  processedTypes.add(typeSchema.name)

  // Process fields to find references
  processFields(typeSchema, allTypes, referencedTypes, processedTypes)

  return referencedTypes
}

/**
 * Lists available schema types for a Sanity project and dataset
 *
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name (default: 'production')
 * @param options - Options for listing schema types
 * @returns Array of schema type names and their kinds
 */
export async function listSchemaTypes(
  projectId: string,
  dataset: string = 'production',
  {allTypes = false}: { allTypes?: boolean } = {}
): Promise<SchemaType[]> {
  try {
    // Get the full schema
    const schema = await getSchema(projectId, dataset)

    // Filter to document types only, unless allTypes is true
    const filteredSchema = allTypes
      ? schema
      : schema.filter((type) => type.type === 'document')

    // Map to just the name and type
    return filteredSchema.map((type) => ({
      name: type.name,
      type: type.type
    }))
  } catch (error: any) {
    logger.error('Error listing schema types:', error)
    throw new Error(`Failed to list schema types: ${error.message}`)
  }
}

/**
 * Gets the detailed schema for a specific type
 *
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name (default: 'production')
 * @param typeName - The name of the type to retrieve
 * @returns The schema definition for the type
 */
export async function getTypeSchema(
  projectId: string,
  dataset: string = 'production',
  typeName: string
): Promise<SchemaTypeDetails> {
  try {
    // Get the full schema
    const schema = await getSchema(projectId, dataset)

    // Find the specific type
    const typeSchema = schema.find((type) => type.name === typeName)

    if (!typeSchema) {
      throw new Error(`Type '${typeName}' not found in schema`)
    }

    return typeSchema
  } catch (error: any) {
    logger.error('Error getting type schema:', error)
    throw new Error(`Failed to get type schema: ${error.message}`)
  }
}
