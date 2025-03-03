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
          
          // Get all releases
          let activeReleases: any[] = [];
          try {
            const releasesResult = await releasesController.listReleases(
              config.projectId,
              config.dataset || "production"
            );
            
            // Filter only active (non-archived) releases
            activeReleases = releasesResult.releases.filter(release => !release.archived);
          } catch (error) {
            console.error('Error fetching releases:', error);
            // Continue with empty releases array
          }
          
          return {
            message: "Welcome to the Sanity MCP Server!",
            instructions: "For this prototype, please only query the following Sanity project and dataset:",
            projectId: config.projectId,
            dataset: config.dataset || "production",
            embeddingsIndices: embeddingsIndices || [], // listEmbeddingsIndices returns an array directly
            documentTypes: schemaTypes || [], // schemaTypes is already an array of objects with name and type
            activeReleases: activeReleases || [], // Include only non-archived releases
            note: `Future versions will support querying any project the user has access to, but for now, please restrict queries to this specific project and dataset. ${activeReleases.length > 0 ? `There are currently ${activeReleases.length} active releases that you can work with.` : 'There are currently no active releases.'}`
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
    
    // GROQ tools
    {
      name: 'getGroqSpecification',
      description: 'Get the GROQ query language specification with examples and documentation',
      parameters: z.object({}),
      handler: async () => {
        return await groqController.getGroqSpecification();
      }
    },
    
    {
      name: 'query',
      description: 'Executes GROQ queries to retrieve content',
      parameters: z.object({
        query: z.string().describe('The GROQ query to execute'),
        params: z.record(z.any()).optional().describe('Query parameters'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ query, params, projectId, dataset }: { 
        query: string, 
        params?: Record<string, any>, 
        projectId: string, 
        dataset: string
      }) => {
        // Fixed parameter order to match function signature
        return await groqController.searchContent(projectId, dataset, query, params || {});
      }
    },
    
    {
      name: 'getDocuments',
      description: 'Gets multiple documents by their IDs',
      parameters: z.object({
        documentIds: z.array(z.string()).describe('Array of document IDs to retrieve'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ documentIds, projectId, dataset }: { documentIds: string[], projectId: string, dataset: string }) => {
        return await groqController.searchContent(projectId, dataset, '*[_id in $documentIds]', { documentIds });
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
    
    // Document tools
    {
      name: 'getDocument',
      description: 'Gets a specific document by ID',
      parameters: z.object({
        documentId: z.string().describe('The ID of the document to retrieve'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ documentId, projectId, dataset }: { documentId: string, projectId: string, dataset: string }) => {
        return await groqController.searchContent(projectId, dataset, '*[_id == $documentId][0]', { documentId });
      }
    },
    
    // Document operations
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
      name: 'createDocument',
      description: 'Creates a new document',
      parameters: z.object({
        document: z.record(z.any()).describe('The document to create'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        returnDocument: z.boolean().optional().default(true).describe('If true, returns the created document')
      }),
      handler: async ({ document, projectId, dataset, returnDocument }: { document: Record<string, any>, projectId: string, dataset: string, returnDocument?: boolean }) => {
        // Ensure document has a _type property as required by CreateMutation
        if (!document._type) {
          throw new Error('Document must have a _type property');
        }
        // Explicitly cast mutations to Mutation[] type
        const mutations = [{ create: document }] as import('../controllers/mutate.js').Mutation[];
        return await mutateController.modifyDocuments(projectId, dataset, mutations, returnDocument);
      }
    },
    
    {
      name: 'updateDocument',
      description: 'Updates an existing document with new data',
      parameters: z.object({
        documentId: z.string().describe('ID of the document to update'),
        patch: z.object({
          set: z.record(z.any()).optional().describe('Fields to set'),
          setIfMissing: z.record(z.any()).optional().describe('Fields to set only if missing'),
          unset: z.array(z.string()).optional().describe('Fields to unset'),
          inc: z.record(z.number()).optional().describe('Fields to increment'),
          dec: z.record(z.number()).optional().describe('Fields to decrement'),
          insert: z.record(z.any()).optional().describe('Fields to insert at position')
        }).describe('The patch operations to apply'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        returnDocument: z.boolean().optional().default(true).describe('If true, returns the updated document')
      }),
      handler: async ({ documentId, patch, projectId, dataset, returnDocument }: { documentId: string, patch: Record<string, any>, projectId: string, dataset: string, returnDocument?: boolean }) => {
        // Explicitly cast mutations to Mutation[] type
        const mutations = [{ patch: { id: documentId, ...patch } }] as import('../controllers/mutate.js').Mutation[];
        return await mutateController.modifyDocuments(projectId, dataset, mutations, returnDocument);
      }
    },
    
    {
      name: 'mutateDocument',
      description: 'Performs multiple mutation operations on a single document',
      parameters: z.object({
        documentId: z.string().describe('ID of the document to mutate'),
        mutations: z.object({
          create: z.record(z.any()).optional().describe('Create the document if it doesn\'t exist (must include _id)'),
          createOrReplace: z.record(z.any()).optional().describe('Create or replace the document'),
          createIfNotExists: z.record(z.any()).optional().describe('Create the document if it doesn\'t exist'),
          patch: z.object({
            set: z.record(z.any()).optional().describe('Fields to set'),
            setIfMissing: z.record(z.any()).optional().describe('Fields to set only if missing'),
            unset: z.array(z.string()).optional().describe('Fields to unset'),
            inc: z.record(z.number()).optional().describe('Fields to increment'),
            dec: z.record(z.number()).optional().describe('Fields to decrement'),
            insert: z.record(z.any()).optional().describe('Fields to insert at position')
          }).optional().describe('The patch operations to apply')
        }).describe('Mutation operations to perform on the document'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        returnDocument: z.boolean().optional().default(true).describe('If true, returns the mutated document')
      }),
      handler: async ({ documentId, mutations, projectId, dataset, returnDocument }: { documentId: string, mutations: Record<string, any>, projectId: string, dataset: string, returnDocument?: boolean }) => {
        let sanityMutations = [] as import('../controllers/mutate.js').Mutation[];
        
        if (mutations.create) {
          const create = { ...mutations.create };
          // Always add the documentId to the create object
          if (!create._id) {
            create._id = documentId;
          }
          // Ensure document has a _type property as required by CreateMutation
          if (!create._type) {
            throw new Error('Document must have a _type property for create mutation');
          }
          sanityMutations.push({ create } as import('../controllers/mutate.js').Mutation);
        }
        
        if (mutations.createOrReplace) {
          const createOrReplace = { ...mutations.createOrReplace };
          // Always add the documentId to the createOrReplace object
          if (!createOrReplace._id) {
            createOrReplace._id = documentId;
          }
          // Ensure document has a _type property
          if (!createOrReplace._type) {
            throw new Error('Document must have a _type property for createOrReplace mutation');
          }
          sanityMutations.push({ createOrReplace } as import('../controllers/mutate.js').Mutation);
        }
        
        if (mutations.patch) {
          // For patch operations, add the id to the patch object if not already present
          const patchObj = { ...mutations.patch };
          if (!patchObj.id) {
            sanityMutations.push({ patch: { id: documentId, ...mutations.patch } } as import('../controllers/mutate.js').Mutation);
          } else {
            sanityMutations.push({ patch: patchObj } as import('../controllers/mutate.js').Mutation);
          }
        }
        
        return await mutateController.modifyDocuments(projectId, dataset, sanityMutations, returnDocument);
      }
    },
    
    {
      name: 'deleteDocument',
      description: 'Deletes a document',
      parameters: z.object({
        documentId: z.string().describe('ID of the document to delete'),
        projectId: z.string().describe('The Sanity project ID'),
        dataset: z.string().default('production').describe('The dataset name (defaults to production)')
      }),
      handler: async ({ documentId, projectId, dataset }: { documentId: string, projectId: string, dataset: string }) => {
        // Explicitly cast mutations to Mutation[] type
        const mutations = [{ delete: { id: documentId } }] as import('../controllers/mutate.js').Mutation[];
        return await mutateController.modifyDocuments(projectId, dataset, mutations);
      }
    },
    
    {
      name: 'batchMutations',
      description: 'Performs multiple document mutations in a single batch operation',
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
        let sanityMutations = [] as import('../controllers/mutate.js').Mutation[];
        
        for (const mutation of mutations) {
          if (mutation.create) {
            const create = { ...mutation.create };
            // Ensure _id is present, but don't throw an error if not
            if (!create._id && create._id !== '') {
              throw new Error('Create mutation must have an _id property');
            }
            // Ensure document has a _type property
            if (!create._type) {
              throw new Error('Document must have a _type property for create mutation');
            }
            sanityMutations.push({ create } as import('../controllers/mutate.js').Mutation);
          }
          
          if (mutation.createOrReplace) {
            const createOrReplace = { ...mutation.createOrReplace };
            // Ensure _id is present, but don't throw an error if not
            if (!createOrReplace._id && createOrReplace._id !== '') {
              throw new Error('Create or replace mutation must have an _id property');
            }
            // Ensure document has a _type property
            if (!createOrReplace._type) {
              throw new Error('Document must have a _type property for createOrReplace mutation');
            }
            sanityMutations.push({ createOrReplace } as import('../controllers/mutate.js').Mutation);
          }
          
          if (mutation.createIfNotExists) {
            const createIfNotExists = { ...mutation.createIfNotExists };
            // Ensure _id is present, but don't throw an error if not
            if (!createIfNotExists._id && createIfNotExists._id !== '') {
              throw new Error('Create if not exists mutation must have an _id property');
            }
            // Ensure document has a _type property
            if (!createIfNotExists._type) {
              throw new Error('Document must have a _type property for createIfNotExists mutation');
            }
            sanityMutations.push({ createIfNotExists } as import('../controllers/mutate.js').Mutation);
          }
          
          if (mutation.patch) {
            if (typeof mutation.patch === 'object') {
              // Handle both direct patch objects and those with nested properties
              if (mutation.patch.id) {
                sanityMutations.push({ patch: mutation.patch } as import('../controllers/mutate.js').Mutation);
              } else {
                throw new Error('Patch mutation must have an id property');
              }
            }
          }
          
          if (mutation.delete) {
            if (typeof mutation.delete === 'object') {
              if (mutation.delete.id) {
                sanityMutations.push({ delete: mutation.delete } as import('../controllers/mutate.js').Mutation);
              } else {
                throw new Error('Delete mutation must have an id property');
              }
            }
          }
        }
        
        return await mutateController.modifyDocuments(projectId, dataset, sanityMutations, returnDocuments);
      }
    },
    
    {
      name: 'updatePortableText',
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
        dataset: z.string().default('production').describe('The dataset name (defaults to production)'),
        returnDocument: z.boolean().optional().default(true).describe('If true, returns the updated document')
      }),
      handler: async ({ documentId, fieldPath, operations, projectId, dataset, returnDocument }: { documentId: string, fieldPath: string, operations: any[], projectId: string, dataset: string, returnDocument?: boolean }) => {
        return await mutateController.modifyPortableTextField(projectId, dataset, documentId, fieldPath, operations, returnDocument);
      }
    },
    
    // Embeddings tools
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
