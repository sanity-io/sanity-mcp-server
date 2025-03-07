import { ToolDefinition } from './tools.js';

/**
 * Interface for a tool provider
 * 
 * Each controller should implement this interface to provide
 * its tool definitions to the main tools controller.
 */
export interface ToolProvider {
  /**
   * Get all tool definitions from this provider
   * 
   * @returns Array of tool definitions
   */
  getToolDefinitions(): ToolDefinition[];
}
