import { z } from "zod";

/**
 * Zod schema for GROQ specification
 */
export const GroqSpecificationSchema = z.object({
  name: z.string().describe("Name of the query language"),
  version: z.string().describe("Version of the specification"),
  description: z.string().describe("Description of GROQ"),
  coreFeatures: z.array(z.string()).describe("List of core GROQ features"),
  queryStructure: z.array(z.object({
    name: z.string().describe("Name of the query structure component"),
    description: z.string().describe("Description of the component"),
    syntax: z.string().describe("Syntax pattern"),
    example: z.string().describe("Example usage")
  })).describe("Components of GROQ query structure"),
  operators: z.array(z.object({
    name: z.string().describe("Operator symbol or name"),
    description: z.string().describe("Description of the operator"),
    example: z.string().describe("Example usage")
  })).describe("Available GROQ operators"),
  examples: z.array(z.object({
    description: z.string().describe("Description of the example"),
    query: z.string().describe("Example GROQ query")
  })).describe("Example GROQ queries"),
  functions: z.array(z.object({
    name: z.string().describe("Function name"),
    description: z.string().describe("Description of the function"),
    example: z.string().describe("Example usage")
  })).describe("Available GROQ functions"),
  resources: z.array(z.object({
    name: z.string().describe("Resource name"),
    url: z.string().url().describe("Resource URL")
  })).describe("Additional GROQ resources and documentation")
});

/**
 * Type for GROQ specification inferred from schema
 */
export type GroqSpecification = z.infer<typeof GroqSpecificationSchema>;

/**
 * Schema for GROQ query parameters
 */
export const GroqQueryParamsSchema = z.object({
  projectId: z.string().describe("Project ID for the Sanity project"),
  dataset: z.string().optional().describe("Dataset name within the project"),
  query: z.string().describe("GROQ query to run"),
  params: z.record(z.unknown()).optional().describe("Optional parameters for the GROQ query")
});

/**
 * Type for GROQ query parameters
 */
export type GroqQueryParams = z.infer<typeof GroqQueryParamsSchema>;

/**
 * Parameter definitions for execute_groq_query tool
 */
export const executeGroqQueryParams = {
  query: z
    .string()
    .describe("The GROQ query to execute"),
  params: z
    .record(z.any())
    .optional()
    .describe("Optional parameters to use in the GROQ query")
};

/**
 * Zod schema for execute_groq_query tool parameters
 */
export const ExecuteGroqQuerySchema = z.object(executeGroqQueryParams); 