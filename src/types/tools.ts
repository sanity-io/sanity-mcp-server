import { z } from 'zod';
import { ToolHandler } from './sharedTypes.js';

/**
 * Generic interface for tool definitions
 * 
 * This interface uses parameterized types to enforce type safety between
 * the tool parameter schema and the handler function.
 */
export interface ToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  parameters: z.ZodType<TParams, any, any>;
  handler: ToolHandler<TParams, TResult>;
}

export interface InitialContext {
  message: string;
  instructions: string;
  projectId?: string;
  dataset?: string;
  embeddingsIndices?: any[];
  documentTypes?: any[];
  activeReleases?: any[];
  note: string;
  warning?: string;
  requiredVariables?: string[];
}
