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
 * Gets the schema definition for a specific document type
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name (default: 'production')
 * @param typeName - The document type name
 * @returns The schema definition for the type
 */
export async function getSchemaForType(projectId: string, dataset: string = 'production', typeName: string): Promise<SchemaTypeDetails> {
  try {
    const schema = await getSchema(projectId, dataset);
    const documentType = schema.find(type => type.name === typeName && type.type === 'document');
    
    if (!documentType) {
      throw new Error(`Document type '${typeName}' not found in schema`);
    }
    
    return documentType;
  } catch (error: any) {
    console.error(`Error getting schema for type ${typeName}:`, error);
    throw new Error(`Failed to get schema for type ${typeName}: ${error.message}`);
  }
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
