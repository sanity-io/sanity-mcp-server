/**
 * Tool definitions controller
 * 
 * This file defines all the MCP tool definitions and their handlers,
 * pulling in functionality from specialized controllers.
 */
import { z } from 'zod';
import config from '../config/config.js';
import { ToolDefinition, InitialContext } from '../types/tools.js';

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
 * @returns Array of tool definition objects
 */
export function getToolDefinitions(): ToolDefinition[] {
  return [
    // Initial context tool - ALWAYS CALL THIS FIRST
    {
      name: 'getInitialContext',
      description: 'IMPORTANT: Call this tool first to get initial context and usage instructions for this MCP server. This provides critical information about which projects and datasets you should use.',
      parameters: z.object({}),
      handler: async (): Promise<InitialContext> => {
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
      handler: async ({ projectId, dataset }: { projectId: string, dataset: string }) => {
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
      handler: async ({ projectId, dataset, allTypes }: { projectId: string, dataset: string, allTypes?: boolean }) => {
        return await schemaController.listSchemaTypes(projectId, dataset, { allTypes });
      }
    },
    
    {
      name: 'getTypeSchema',
      description: 'Gets the schema definition for a specific type',
      parameters: z.object({
        typeName: z.string().describe('The name of the type to get the schema for'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ typeName, projectId, dataset }: { typeName: string, projectId: string, dataset: string }) => {
        return await schemaController.getTypeSchema(typeName, projectId, dataset);
      }
    },
    
    // Content tools
    {
      name: 'searchContent',
      description: 'Searches for content using GROQ queries',
      parameters: z.object({
        query: z.string().describe('The GROQ query to execute'),
        params: z.record(z.any()).optional().describe('Query parameters'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ query, params, projectId, dataset }: { query: string, params?: Record<string, any>, projectId: string, dataset: string }) => {
        return await contentController.searchContent(query, params, projectId, dataset);
      }
    },
    
    {
      name: 'subscribeToUpdates',
      description: 'Creates a real-time update listener for a query',
      parameters: z.object({
        query: z.string().describe('The GROQ query to listen to'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ query, projectId, dataset }: { query: string, projectId: string, dataset: string }) => {
        return await contentController.subscribeToUpdates({ projectId, dataset, query });
      }
    },
    
    // Action tools
    {
      name: 'publishDocument',
      description: 'Publishes a draft document',
      parameters: z.object({
        documentId: z.string().describe('The ID of the draft document to publish'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ documentId, projectId, dataset }: { documentId: string, projectId: string, dataset: string }) => {
        return await actionsController.publishDocument(documentId, projectId, dataset);
      }
    },
    
    {
      name: 'unpublishDocument',
      description: 'Unpublishes a published document',
      parameters: z.object({
        documentId: z.string().describe('The ID of the published document to unpublish'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ documentId, projectId, dataset }: { documentId: string, projectId: string, dataset: string }) => {
        return await actionsController.unpublishDocument(documentId, projectId, dataset);
      }
    },
    
    {
      name: 'createRelease',
      description: 'Creates a new release',
      parameters: z.object({
        title: z.string().describe('Title of the release'),
        description: z.string().optional().describe('Optional description of the release'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ title, description, projectId, dataset }: { title: string, description?: string, projectId: string, dataset: string }) => {
        return await actionsController.createRelease(title, description, projectId, dataset);
      }
    },
    
    {
      name: 'addDocumentToRelease',
      description: 'Adds a document to a release',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release'),
        documentId: z.string().describe('ID of the document to add to the release'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, documentId, projectId, dataset }: { releaseId: string, documentId: string, projectId: string, dataset: string }) => {
        return await actionsController.addDocumentToRelease(releaseId, documentId, projectId, dataset);
      }
    },
    
    {
      name: 'listReleaseDocuments',
      description: 'Lists documents in a release',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, projectId, dataset }: { releaseId: string, projectId: string, dataset: string }) => {
        return await actionsController.listReleaseDocuments(releaseId, projectId, dataset);
      }
    },
    
    // Mutation tools
    {
      name: 'modifyDocuments',
      description: 'Creates, updates or deletes documents',
      parameters: z.object({
        mutations: z.array(z.object({
          create: z.record(z.any()).optional(),
          createOrReplace: z.record(z.any()).optional(),
          createIfNotExists: z.record(z.any()).optional(),
          patch: z.object({
            id: z.string(),
            set: z.record(z.any()).optional(),
            setIfMissing: z.record(z.any()).optional(),
            unset: z.array(z.string()).optional(),
            inc: z.record(z.number()).optional(),
            dec: z.record(z.number()).optional(),
            insert: z.record(z.any()).optional()
          }).optional(),
          delete: z.object({ id: z.string() }).optional()
        })).describe('Array of mutation objects'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        returnDocuments: z.boolean().optional().default(false).describe('If true, returns the modified documents')
      }),
      handler: async ({ mutations, projectId, dataset, returnDocuments }: { mutations: any[], projectId: string, dataset: string, returnDocuments?: boolean }) => {
        return await mutateController.modifyDocuments(mutations, projectId, dataset, returnDocuments);
      }
    },
    
    {
      name: 'modifyPortableTextField',
      description: 'Updates a portable text field using operations',
      parameters: z.object({
        documentId: z.string().describe('ID of the document containing the portable text field'),
        fieldPath: z.string().describe('Path to the portable text field (e.g. "body" or "sections[0].content")'),
        operations: z.array(z.object({
          type: z.enum(['insert', 'replace', 'remove']),
          position: z.enum(['beginning', 'end', 'at']),
          atIndex: z.number().optional(),
          value: z.any().optional()
        })).describe('Operations to perform on the portable text field'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ documentId, fieldPath, operations, projectId, dataset }: { documentId: string, fieldPath: string, operations: any[], projectId: string, dataset: string }) => {
        return await mutateController.modifyPortableTextField(documentId, fieldPath, operations, projectId, dataset);
      }
    },
    
    // Search tools
    {
      name: 'listEmbeddingsIndices',
      description: 'Lists available embeddings indices in a dataset',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ projectId, dataset }: { projectId: string, dataset: string }) => {
        return await searchController.listEmbeddingsIndices({ projectId, dataset });
      }
    },
    
    {
      name: 'semanticSearch',
      description: 'Performs semantic search using embeddings',
      parameters: z.object({
        query: z.string().describe('The natural language query to search for'),
        indexName: z.string().describe('The name of the embeddings index to search'),
        maxResults: z.number().optional().default(10).describe('Maximum number of results to return'),
        types: z.array(z.string()).optional().describe('Optional filter to select specific document types'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ query, indexName, maxResults, types, projectId, dataset }: { query: string, indexName: string, maxResults?: number, types?: string[], projectId: string, dataset: string }) => {
        return await searchController.semanticSearch(query, { indexName, maxResults, types, projectId, dataset });
      }
    }
  ];
}

/**
 * Get a specific tool definition by name
 * 
 * @param toolName - The name of the tool to retrieve
 * @returns The tool definition object or null if not found
 */
export function getToolDefinition(toolName: string): ToolDefinition | null {
  const tools = getToolDefinitions();
  return tools.find(tool => tool.name === toolName) || null;
}

/**
 * Execute a tool by name with the provided arguments
 * 
 * @param toolName - The name of the tool to execute
 * @param args - The arguments to pass to the tool handler
 * @returns The result of the tool execution
 */
export async function executeTool(toolName: string, args: Record<string, any> = {}): Promise<any> {
  const tool = getToolDefinition(toolName);
  
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  
  try {
    // Parse and validate the input arguments
    const validatedArgs = tool.parameters.parse(args);
    
    // Execute the handler with validated arguments
    return await tool.handler(validatedArgs);
  } catch (error: any) {
    if (error.errors) {
      // Zod validation error
      throw new Error(`Invalid arguments for tool '${toolName}': ${error.message}`);
    }
    throw new Error(`Error executing tool '${toolName}': ${error.message}`);
  }
}
