/**
 * Tool definitions registry
 * 
 * This file provides a central registry for all MCP tool definitions,
 * aggregating them from specialized tool providers.
 */
import { ToolDefinition } from '../types/tools.js';
import { ToolProvider } from '../types/toolProvider.js';
import logger from '../utils/logger.js';

// Import specialized tool providers
import { ContextToolProvider } from './contextTools.js';
import { SchemaToolProvider } from './schemaTools.js';
import { GroqToolProvider } from './groqTools.js';
import { ActionsToolProvider } from './actionsTools.js';
import { ReleasesToolProvider } from './releasesTools.js';
import { MutateToolProvider } from './mutateTools.js';
import { EmbeddingsToolProvider } from './embeddingsTools.js';
import { ProjectsToolProvider } from './projectsTools.js';

// Initialize all tool providers
const toolProviders: ToolProvider[] = [
  new ContextToolProvider(),
  new SchemaToolProvider(),
  new GroqToolProvider(),
  new ActionsToolProvider(),
  new ReleasesToolProvider(),
  new MutateToolProvider(),
  new EmbeddingsToolProvider(),
  new ProjectsToolProvider()
];

// Cache for tool definitions
let toolDefinitionsCache: ToolDefinition[] | null = null;

/**
 * Get all tool definitions
 * 
 * @returns Array of tool definition objects
 */
export function getToolDefinitions(): ToolDefinition[] {
  if (toolDefinitionsCache) {
    return toolDefinitionsCache;
  }
  
  // Collect tool definitions from all providers
  const toolDefinitions: ToolDefinition[] = [];
  for (const provider of toolProviders) {
    toolDefinitions.push(...provider.getToolDefinitions());
  }
  
  // Cache the results
  toolDefinitionsCache = toolDefinitions;
  return toolDefinitions;
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
  
  if (!tool.handler) {
    throw new Error(`Tool '${toolName}' has no handler`);
  }
  
  try {
    // Execute the tool handler with provided arguments
    return await tool.handler(args);
  } catch (error) {
    logger.error(`Error executing tool '${toolName}':`, error);
    throw error;
  }
}
