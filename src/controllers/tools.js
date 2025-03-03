/**
 * Tool definitions controller
 * 
 * This file defines all the MCP tool definitions and their handlers,
 * pulling in functionality from specialized controllers.
 */
import { z } from 'zod';
import config from '../config/config.js';

// Import controllers
import * as projectsController from './projects.js';
import * as schemaController from './schema.js';
import * as contentController from './content.js';
import * as actionsController from './actions.js';
import * as modifyController from './modify.js';
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
        
        return {
          message: "Welcome to the Sanity MCP Server!",
          instructions: "For this prototype, please only query the following Sanity project and dataset:",
          projectId: config.projectId,
          dataset: config.dataset || "production",
          note: "Future versions will support querying any project the user has access to, but for now, please restrict queries to this specific project and dataset."
        };
      }
    },
    
    // Project/Org tools
    {
      name: 'listOrganizationsAndProjects',
      description: 'Lists all organizations and their projects that the user has access to',
      parameters: z.object({}),
      handler: async () => {
        return await projectsController.listOrganizationsAndProjects();
      }
    },
    
    {
      name: 'listStudios',
      description: 'Lists all studios (editing interfaces) for a specific project',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID')
      }),
      handler: async ({ projectId }) => {
        return await projectsController.listStudios(projectId);
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
    
    // Search tools
    {
      name: 'semanticSearch',
      description: 'Perform semantic search on Sanity documentation and guides using embeddings',
      parameters: z.object({
        query: z.string().describe('Natural language query to search for semantically similar content'),
        maxResults: z.number().optional().default(8).describe('Maximum number of results to return (default: 8)'),
        types: z.array(z.string()).optional().default(["article", "guide"]).describe('Optional filter to select specific document types')
      }),
      handler: async ({ query, maxResults, types }) => {
        return await searchController.semanticSearch(query, maxResults, types);
      }
    },
    
    // Any additional tools would be added here...
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
