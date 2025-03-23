import { z } from "zod";

/**
 * Schema for creating a new document
 */
export const createDocumentParams = {
  document: z
    .object({
      _type: z.string().describe("The type of document to create")
    })
    .catchall(z.any())
    .describe("The document to create. Must include _type field and can include any other fields. Please ensure that the document is valid according to the schema for the _type.")
};

/**
 * Zod schema for create_document tool parameters
 */
export const CreateDocumentSchema = z.object(createDocumentParams);

/**
 * Type for create document parameters
 */
export type CreateDocumentParams = z.infer<typeof CreateDocumentSchema>; 