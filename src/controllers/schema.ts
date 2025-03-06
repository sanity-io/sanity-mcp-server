import { readFile } from 'fs/promises';
import config from '../config/config.js';
import { SchemaType } from '../types/index.js';

interface SchemaTypeDetails extends SchemaType {
  fields?: any[];
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
    const schemaPath = config.getSchemaPath(projectId, dataset);
    
    try {
      const schemaData = await readFile(schemaPath, 'utf-8');
      return JSON.parse(schemaData);
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        throw new Error(
          `Schema file not found for project ${projectId} and dataset ${dataset}. ` +
          `Please run 'npx sanity@latest schema extract' in your Sanity studio and ` +
          `save the output to ${schemaPath}`
        );
      }
      throw readError;
    }
  } catch (error: any) {
    console.error(`Error getting schema for ${projectId}/${dataset}:`, error);
    throw new Error(`Failed to get schema: ${error.message}`);
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
  options: { includeReferences?: boolean } = {}
): Promise<SchemaTypeDetails> {
  try {
    const schema = await getSchema(projectId, dataset);
    
    // Find any type with the given name, not just document types
    const typeSchema = schema.find(item => item.name === typeName);
    
    if (!typeSchema) {
      throw new Error(`Type ${typeName} not found in schema`);
    }
    
    // If includeReferences is true, also include referenced types
    if (options.includeReferences) {
      const result = { 
        ...typeSchema, 
        references: [] as SchemaTypeDetails[]
      };
      
      // Find referenced types
      const referencedTypes = findReferencedTypes(typeSchema, schema);
      if (referencedTypes.length > 0) {
        result.references = referencedTypes;
      }
      
      return result;
    }
    
    return typeSchema;
  } catch (error: any) {
    console.error(`Error getting schema for type ${typeName}:`, error);
    throw new Error(`Failed to get schema for type ${typeName}: ${error.message}`);
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
  const references: SchemaTypeDetails[] = [];
  const referencedTypeNames = new Set<string>();
  
  // Helper function to recursively check for references
  function checkForReferences(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if this is a reference definition
    if (obj.type === 'reference' && obj.to?.type) {
      referencedTypeNames.add(obj.to.type);
    }
    
    // Check for object types that might be inline or referenced
    if (obj.type === 'object' && obj.name) {
      referencedTypeNames.add(obj.name);
    }
    
    // Check arrays for object or reference types
    if (obj.type === 'array' && obj.of) {
      (Array.isArray(obj.of) ? obj.of : [obj.of]).forEach((item: any) => {
        checkForReferences(item);
      });
    }
    
    // Check for dereferencesTo property which indicates a reference
    if (obj.dereferencesTo) {
      referencedTypeNames.add(obj.dereferencesTo);
    }
    
    // Recursively check all other properties
    Object.values(obj).forEach(value => {
      if (value && typeof value === 'object') {
        checkForReferences(value);
      }
    });
  }
  
  // Start the recursive search
  checkForReferences(typeSchema);
  
  // Add all found referenced types to the result
  referencedTypeNames.forEach(name => {
    const referencedType = allTypes.find(t => t.name === name);
    if (referencedType && !references.some(r => r.name === name)) {
      references.push(referencedType);
    }
  });
  
  return references;
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
  { allTypes = false }: { allTypes?: boolean } = {}
): Promise<SchemaType[]> {
  try {
    const schema = await getSchema(projectId, dataset);
    
    const filteredSchema = allTypes 
      ? schema 
      : schema.filter(item => item.type === 'document');
    
    return filteredSchema.map(item => ({
      name: item.name,
      type: item.type
    }));
  } catch (error: any) {
    console.error(`Error listing schema types for ${projectId}/${dataset}:`, error);
    throw new Error(`Failed to list schema types: ${error.message}`);
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
    const schema = await getSchema(projectId, dataset);
    
    const typeSchema = schema.find(item => item.name === typeName);
    
    if (!typeSchema) {
      throw new Error(`Type '${typeName}' not found in schema`);
    }
    
    return typeSchema;
  } catch (error: any) {
    console.error(`Error getting type schema for ${typeName}:`, error);
    throw new Error(`Failed to get type schema: ${error.message}`);
  }
}
