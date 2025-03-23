import { z } from "zod";

export const GetDocumentParams = {
  documentId: z.string().describe("Document id for the sanity document"),
};

export const GetDocumentsParams = {
  documentIds: z.array(z.string()).describe("Ids for the documents to fetch"),
};

export const GetDocumentParamsSchema = z.object(GetDocumentParams);
export const GetDocumentsParamsSchema = z.object(GetDocumentsParams);

export type GetDocumentParamsType = z.infer<typeof GetDocumentParamsSchema>;
export type GetDocumentsParamsType = z.infer<typeof GetDocumentsParamsSchema>;
