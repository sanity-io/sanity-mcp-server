import { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodType<any, any, any>;
  handler: (args: any) => Promise<any>;
}

export interface InitialContext {
  message: string;
  instructions: string;
  projectId?: string;
  dataset?: string;
  embeddingsIndices?: any[];
  documentTypes?: any[];
  note: string;
  warning?: string;
  requiredVariables?: string[];
}
