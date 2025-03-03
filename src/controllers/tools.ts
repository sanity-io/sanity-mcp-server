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
import * as groqController from './groq.js';
import * as actionsController from './actions.js';
import * as releasesController from './releases.js';
import * as mutateController from './mutate.js';
import * as embeddingsController from './embeddings.js';

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
          const embeddingsIndices = await embeddingsController.listEmbeddingsIndices({
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
        // Fixed parameter order to match function signature:
        // searchContent(projectId, dataset, query, params = {}, verifyWithLLM = false)
        return await groqController.searchContent(projectId, dataset, query, params || {});
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
        return await groqController.subscribeToUpdates(projectId, dataset, query);
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
        return await actionsController.publishDocument(projectId, dataset, documentId);
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
        return await actionsController.unpublishDocument(projectId, dataset, documentId);
      }
    },
    
    // Release tools
    {
      name: 'createRelease',
      description: 'Creates a new release',
      parameters: z.object({
        title: z.string().describe('Title of the release'),
        description: z.string().optional().describe('Optional description of the release'),
        releaseType: z.enum(['asap', 'scheduled']).optional().describe('Type of release (asap or scheduled)'),
        intendedPublishAt: z.string().optional().describe('ISO datetime string for when to publish a scheduled release'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ title, description, releaseType, intendedPublishAt, projectId, dataset }: { 
        title: string, 
        description?: string, 
        releaseType?: 'asap' | 'scheduled',
        intendedPublishAt?: string,
        projectId: string, 
        dataset: string 
      }) => {
        const releaseId = `release-${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        return await releasesController.createRelease(
          projectId, 
          dataset, 
          releaseId, 
          title, 
          { description, releaseType, intendedPublishAt }
        );
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
        return await releasesController.addDocumentToRelease(projectId, dataset, releaseId, documentId);
      }
    },
    
    {
      name: 'removeDocumentFromRelease',
      description: 'Removes a document from a release',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release'),
        documentId: z.string().describe('ID of the document to remove from the release'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, documentId, projectId, dataset }: { releaseId: string, documentId: string, projectId: string, dataset: string }) => {
        return await releasesController.removeDocumentFromRelease(projectId, dataset, releaseId, documentId);
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
        return await releasesController.listReleaseDocuments(projectId, dataset, releaseId);
      }
    },
    
    {
      name: 'publishRelease',
      description: 'Publishes all documents in a release',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release to publish'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, projectId, dataset }: { releaseId: string, projectId: string, dataset: string }) => {
        return await releasesController.publishRelease(projectId, dataset, releaseId);
      }
    },
    
    {
      name: 'listReleases',
      description: 'Lists all releases for a project and dataset',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ projectId, dataset }: { projectId: string, dataset: string }) => {
        return await releasesController.listReleases(projectId, dataset);
      }
    },
    
    {
      name: 'getRelease',
      description: 'Gets a specific release by ID',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release to retrieve'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, projectId, dataset }: { releaseId: string, projectId: string, dataset: string }) => {
        return await releasesController.getRelease(projectId, dataset, releaseId);
      }
    },
    
    {
      name: 'updateRelease',
      description: 'Updates a release\'s information',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release to update'),
        title: z.string().optional().describe('New title for the release'),
        description: z.string().optional().describe('New description for the release'),
        releaseType: z.enum(['asap', 'scheduled']).optional().describe('New type for the release'),
        intendedPublishAt: z.string().optional().describe('New scheduled publish date (ISO string)'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, title, description, releaseType, intendedPublishAt, projectId, dataset }: {
        releaseId: string,
        title?: string,
        description?: string,
        releaseType?: 'asap' | 'scheduled',
        intendedPublishAt?: string,
        projectId: string,
        dataset: string
      }) => {
        return await releasesController.updateRelease(projectId, dataset, releaseId, {
          title, description, releaseType, intendedPublishAt
        });
      }
    },
    
    {
      name: 'scheduleRelease',
      description: 'Schedules a release for publishing at a specific time',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release to schedule'),
        publishAt: z.string().describe('ISO datetime string of when to publish the release'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, publishAt, projectId, dataset }: { releaseId: string, publishAt: string, projectId: string, dataset: string }) => {
        return await releasesController.scheduleRelease(projectId, dataset, releaseId, publishAt);
      }
    },
    
    {
      name: 'unscheduleRelease',
      description: 'Unschedules a previously scheduled release',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release to unschedule'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, projectId, dataset }: { releaseId: string, projectId: string, dataset: string }) => {
        return await releasesController.unscheduleRelease(projectId, dataset, releaseId);
      }
    },
    
    {
      name: 'archiveRelease',
      description: 'Archives a release',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release to archive'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, projectId, dataset }: { releaseId: string, projectId: string, dataset: string }) => {
        return await releasesController.archiveRelease(projectId, dataset, releaseId);
      }
    },
    
    {
      name: 'unarchiveRelease',
      description: 'Unarchives a previously archived release',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release to unarchive'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, projectId, dataset }: { releaseId: string, projectId: string, dataset: string }) => {
        return await releasesController.unarchiveRelease(projectId, dataset, releaseId);
      }
    },
    
    {
      name: 'deleteRelease',
      description: 'Deletes an archived release',
      parameters: z.object({
        releaseId: z.string().describe('ID of the release to delete'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ releaseId, projectId, dataset }: { releaseId: string, projectId: string, dataset: string }) => {
        return await releasesController.deleteRelease(projectId, dataset, releaseId);
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
        // Fixed: modifyDocuments takes 3 parameters: projectId, dataset, mutations
        return await mutateController.modifyDocuments(projectId, dataset, mutations);
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
        // Fixed: order should be projectId, dataset, documentId, fieldPath, operations
        return await mutateController.modifyPortableTextField(projectId, dataset, documentId, fieldPath, operations);
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
        return await embeddingsController.listEmbeddingsIndices({ projectId, dataset });
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
        return await embeddingsController.semanticSearch(query, { indexName, maxResults, types, projectId, dataset });
      }
    },
    
    // Get GROQ specification
    {
      name: 'getGroqSpecification',
      description: 'Get the GROQ query language specification with examples and documentation',
      parameters: z.object({}),
      handler: async () => {
        return await groqController.getGroqSpecification();
      }
    },
    
    // List embeddings indices
    {
      name: 'listEmbeddingsIndices',
      description: 'Lists available embeddings indices in a dataset',
      parameters: z.object({
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ projectId, dataset }: { projectId: string, dataset: string }) => {
        return await embeddingsController.listEmbeddingsIndices({ projectId, dataset });
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
