/**
 * Tool definitions controller
 * 
 * This file defines all the MCP tool definitions and their handlers,
 * pulling in functionality from specialized controllers.
 */
import { z } from 'zod';
import config from '../config/config.js';

// Import controllers
// import * as projectsController from './projects.js'; // Commented out as requested - no way to mint tokens yet
import * as schemaController from './schema.js';
import * as contentController from './content.js';
import * as actionsController from './actions.js';
import * as mutateController from './mutate.js';
import * as searchController from './search.js';

/**
 * Get all tool definitions
 * 
 * @returns {Array} Array of tool definition objects
 */
export function getToolDefinitions() {
  return [
    // Initial context tool - ALWAYS CALL THIS FIRST
    {
      name: 'getInitialContext',
      description: 'IMPORTANT: Call this tool first to get initial context and usage instructions for this MCP server. This provides critical information about which projects and datasets you should use.',
      parameters: z.object({}),
      handler: async () => {
        // Validate that we have project ID and dataset configured
        if (!config.projectId) {
          return {
            message: "Welcome to the Sanity MCP Server!",
            warning: "SANITY_PROJECT_ID is not configured. Please set it in your environment variables.",
            instructions: "For this prototype, you need to set the following environment variables:",
            requiredVariables: ["SANITY_PROJECT_ID", "SANITY_DATASET", "SANITY_TOKEN"],
            note: "Once these are set, the server will be ready to use."
          };
        }
        
        try {
          // Get embeddings indices
          const embeddingsIndices = await searchController.listEmbeddingsIndices({
            projectId: config.projectId,
            dataset: config.dataset || "production"
          });
          
          // Get schema types - only document types
          const schemaTypes = await schemaController.listSchemaTypes(
            config.projectId,
            config.dataset || "production",
            { allTypes: false }
          );
          
          return {
            message: "Welcome to the Sanity MCP Server!",
            instructions: "For this prototype, please only query the following Sanity project and dataset:",
            projectId: config.projectId,
            dataset: config.dataset || "production",
            embeddingsIndices: embeddingsIndices || [], // listEmbeddingsIndices returns an array directly
            documentTypes: schemaTypes || [], // schemaTypes is already an array of objects with name and type
            note: "Future versions will support querying any project the user has access to, but for now, please restrict queries to this specific project and dataset."
          };
        } catch (error) {
          // If we encounter an error fetching the additional data, fall back to basic info
          console.error("Error fetching additional context data:", error);
          return {
            message: "Welcome to the Sanity MCP Server!",
            instructions: "For this prototype, please only query the following Sanity project and dataset:",
            projectId: config.projectId,
            dataset: config.dataset || "production",
            note: "Future versions will support querying any project the user has access to, but for now, please restrict queries to this specific project and dataset.",
            warning: "Unable to fetch embeddings indices and schema types due to an error. You can manually call listEmbeddingsIndices and listSchemaTypes to get this information."
          };
        }
      }
    },
    
    // Schema tools
    {
      name: 'getSchema',
      description: 'Gets the full schema for a Sanity project and dataset',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ projectId, dataset }) => {
        return await schemaController.getSchema(projectId, dataset);
      }
    },
    
    {
      name: 'listSchemaTypes',
      description: 'Lists all document types in a Sanity project and dataset',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        allTypes: z.boolean().optional().default(false).describe('If true, returns all types, not just document types')
      }),
      handler: async ({ projectId, dataset, allTypes }) => {
        return await schemaController.listSchemaTypes(projectId, dataset, { allTypes });
      }
    },
    
    {
      name: 'getTypeSchema',
      description: 'Gets the detailed schema definition for a specific type',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        typeName: z.string().describe('The name of the type to retrieve')
      }),
      handler: async ({ projectId, dataset, typeName }) => {
        return await schemaController.getTypeSchema(projectId, dataset, typeName);
      }
    },
    
    // Content tools
    {
      name: 'searchContent',
      description: 'Searches for content using GROQ query language',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        query: z.string().describe('GROQ query string'),
        params: z.record(z.any()).optional().describe('Query parameters')
      }),
      handler: async ({ projectId, dataset, query, params }) => {
        return await contentController.searchContent(projectId, dataset, query, params);
      }
    },
    
    {
      name: 'subscribeToUpdates',
      description: 'Subscribes to real-time updates for documents matching a query',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        query: z.string().describe('GROQ query defining which documents to watch')
      }),
      handler: async ({ projectId, dataset, query }) => {
        return await contentController.subscribeToUpdates(projectId, dataset, query);
      }
    },
    
    // Actions tools
    {
      name: 'publishDocument',
      description: 'Publishes a document (makes draft the published version)',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        documentId: z.string().describe('ID of the document to publish')
      }),
      handler: async ({ projectId, dataset, documentId }) => {
        return await actionsController.publishDocument(projectId, dataset, documentId);
      }
    },
    
    {
      name: 'unpublishDocument',
      description: 'Unpublishes a document (keeps it as draft only)',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        documentId: z.string().describe('ID of the document to unpublish')
      }),
      handler: async ({ projectId, dataset, documentId }) => {
        return await actionsController.unpublishDocument(projectId, dataset, documentId);
      }
    },
    
    {
      name: 'createRelease',
      description: 'Creates a new release for staged publishing',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        title: z.string().describe('Title for the release'),
        description: z.string().optional().describe('Optional description for the release')
      }),
      handler: async ({ projectId, dataset, title, description }) => {
        return await actionsController.createRelease(projectId, dataset, title, description);
      }
    },
    
    {
      name: 'addDocumentToRelease',
      description: 'Adds a document to a release for staged publishing',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        releaseId: z.string().describe('ID of the release to add the document to'),
        documentId: z.string().describe('ID of the document to add to the release')
      }),
      handler: async ({ projectId, dataset, releaseId, documentId }) => {
        return await actionsController.addDocumentToRelease(projectId, dataset, releaseId, documentId);
      }
    },
    
    {
      name: 'listReleaseDocuments',
      description: 'Lists all documents included in a release',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        releaseId: z.string().describe('ID of the release to list documents for')
      }),
      handler: async ({ projectId, dataset, releaseId }) => {
        return await actionsController.listReleaseDocuments(projectId, dataset, releaseId);
      }
    },
    
    {
      name: 'publishRelease',
      description: 'Publishes all documents in a release',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        releaseId: z.string().describe('ID of the release to publish')
      }),
      handler: async ({ projectId, dataset, releaseId }) => {
        return await actionsController.publishRelease(projectId, dataset, releaseId);
      }
    },
    
    // Modify tools
    {
      name: 'modifyDocuments',
      description: 'Creates or updates documents',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        mutations: z.array(z.object({
          create: z.object({}).optional(),
          createOrReplace: z.object({}).optional(),
          createIfNotExists: z.object({}).optional(),
          patch: z.object({
            id: z.string(),
            set: z.object({}).optional(),
            setIfMissing: z.object({}).optional(),
            unset: z.array(z.string()).optional(),
            insert: z.object({}).optional(),
            inc: z.object({}).optional(),
            dec: z.object({}).optional()
          }).optional(),
          delete: z.object({
            id: z.string()
          }).optional()
        }))
      }),
      handler: async ({ projectId, dataset, mutations }) => {
        return await mutateController.modifyDocuments(projectId, dataset, mutations);
      }
    },
    
    {
      name: 'modifyPortableTextField',
      description: 'Modifies a portable text field in a document, with enhanced handling for complex text structures',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        documentId: z.string().describe('ID of the document to modify'),
        fieldPath: z.string().describe('Path to the portable text field (e.g. "content" or "sections[0].body")'),
        operations: z.array(z.object({
          type: z.enum(['insert', 'replace', 'remove']),
          position: z.enum(['beginning', 'end', 'at']),
          atIndex: z.number().optional(),
          value: z.any().optional()
        }))
      }),
      handler: async ({ projectId, dataset, documentId, fieldPath, operations }) => {
        return await mutateController.modifyPortableTextField(projectId, dataset, documentId, fieldPath, operations);
      }
    },
    
    // Search tools
    {
      name: 'listEmbeddingsIndices',
      description: 'List all available embeddings indices for a dataset',
      parameters: z.object({
        projectId: z.string().optional().describe('The Sanity project ID (defaults to env variable)'),
        dataset: z.string().optional().describe('The dataset to list indices from (defaults to env variable)')
      }),
      handler: async ({ projectId, dataset }) => {
        return await searchController.listEmbeddingsIndices({ projectId, dataset });
      }
    },
    
    {
      name: 'semanticSearch',
      description: 'Perform semantic search using embeddings',
      parameters: z.object({
        query: z.string().describe('Natural language query to search for semantically similar content'),
        indexName: z.string().describe('Name of the embeddings index to search'),
        maxResults: z.number().optional().default(8).describe('Maximum number of results to return (default: 8)'),
        types: z.array(z.string()).optional().describe('Optional filter to select specific document types'),
        projectId: z.string().optional().describe('The Sanity project ID (defaults to env variable)'),
        dataset: z.string().optional().describe('The dataset to search in (defaults to env variable)')
      }),
      handler: async ({ query, indexName, maxResults, types, projectId, dataset }) => {
        return await searchController.semanticSearch(query, { indexName, maxResults, types, projectId, dataset });
      }
    }
  ];
}

/**
 * Get a specific tool definition by name
 * 
 * @param {string} toolName - The name of the tool to retrieve
 * @returns {Object|null} The tool definition object or null if not found
 */
export function getToolDefinition(toolName) {
  const tools = getToolDefinitions();
  return tools.find(tool => tool.name === toolName) || null;
}

/**
 * Execute a tool by name with the provided arguments
 * 
 * @param {string} toolName - The name of the tool to execute
 * @param {Object} args - The arguments to pass to the tool handler
 * @returns {Promise<any>} The result of the tool execution
 */
export async function executeTool(toolName, args = {}) {
  const tool = getToolDefinition(toolName);
  
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  
  try {
    // Parse and validate the input arguments
    const validatedArgs = tool.parameters.parse(args);
    
    // Execute the handler with validated arguments
    return await tool.handler(validatedArgs);
  } catch (error) {
    if (error.errors) {
      // Zod validation error
      throw new Error(`Invalid arguments for tool '${toolName}': ${error.message}`);
    }
    throw new Error(`Error executing tool '${toolName}': ${error.message}`);
  }
}
