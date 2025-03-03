import { readFile } from 'fs/promises';
import config from '../config/config.js';

/**
 * Gets the full schema for a Sanity project and dataset
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name (default: 'production')
 * @returns {Promise<Object>} The schema object
 */
export async function getSchema(projectId, dataset = 'production') {
  try {
    const schemaPath = config.getSchemaPath(projectId, dataset);
    
    try {
      const schemaData = await readFile(schemaPath, 'utf-8');
      return JSON.parse(schemaData);
    } catch (readError) {
      if (readError.code === 'ENOENT') {
        throw new Error(
          `Schema file not found for project ${projectId} and dataset ${dataset}. ` +
          `Please run 'npx sanity@latest schema extract' in your Sanity studio and ` +
          `save the output to ${schemaPath}`
        );
      }
      throw readError;
    }
  } catch (error) {
    console.error(`Error getting schema for ${projectId}/${dataset}:`, error);
    throw new Error(`Failed to get schema: ${error.message}`);
  }
}

/**
 * Gets the schema definition for a specific document type
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name (default: 'production')
 * @param {string} typeName - The document type name
 * @returns {Promise<Object>} The schema definition for the type
 */
export async function getSchemaForType(projectId, dataset = 'production', typeName) {
  try {
    const schema = await getSchema(projectId, dataset);
    const documentType = schema.find(type => type.name === typeName && type.type === 'document');
    
    if (!documentType) {
      throw new Error(`Document type '${typeName}' not found in schema`);
    }
    
    return documentType;
  } catch (error) {
    console.error(`Error getting schema for type ${typeName}:`, error);
    throw new Error(`Failed to get schema for type ${typeName}: ${error.message}`);
  }
}

/**
 * Lists available schema types for a Sanity project and dataset
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name (default: 'production')
 * @param {Object} options - Options for listing schema types
 * @param {boolean} options.allTypes - If true, returns all types, otherwise only document types (default: false)
 * @returns {Promise<Array>} Array of schema type names and their kinds
 */
export async function listSchemaTypes(projectId, dataset = 'production', { allTypes = false } = {}) {
  try {
    const schema = await getSchema(projectId, dataset);
    
    const filteredSchema = allTypes 
      ? schema 
      : schema.filter(item => item.type === 'document');
    
    return filteredSchema.map(item => ({
      name: item.name,
      type: item.type
    }));
  } catch (error) {
    console.error(`Error listing schema types for ${projectId}/${dataset}:`, error);
    throw new Error(`Failed to list schema types: ${error.message}`);
  }
}

/**
 * Gets the detailed schema for a specific type
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name (default: 'production')
 * @param {string} typeName - The name of the type to retrieve
 * @returns {Promise<Object>} The schema definition for the type
 */
export async function getTypeSchema(projectId, dataset = 'production', typeName) {
  try {
    const schema = await getSchema(projectId, dataset);
    
    const typeSchema = schema.find(item => item.name === typeName);
    
    if (!typeSchema) {
      throw new Error(`Type '${typeName}' not found in schema`);
    }
    
    return typeSchema;
  } catch (error) {
    console.error(`Error getting schema for type ${typeName}:`, error);
    throw new Error(`Failed to get schema for type ${typeName}: ${error.message}`);
  }
}
