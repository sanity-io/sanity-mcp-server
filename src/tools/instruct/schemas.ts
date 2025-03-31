import { z } from "zod";

export const updateDocumentWithAiParams = {
  documentId: z.string().describe("The ID of the document to update"),
  schemaId: z.string().describe("Schema ID for the document to update."),
  instruction: z
    .string()
    .describe("The instruction for AI to update the document"),
  path: z
    .string()
    .optional()
    .describe(
      "Optional path within the document to target with the instruction",
    ),
  async: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "If true, document update will run in the background and only return the document ID. Use this when updating 2 or more documents for better performance.",
    ),
} as const;

export const updateDocumentWithAiSchema = z.object(updateDocumentWithAiParams);

export type UpdateDocumentWithAiParams = z.infer<typeof updateDocumentWithAiSchema>;