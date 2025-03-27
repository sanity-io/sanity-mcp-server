import { z } from "zod";

export const SemanticSearchParams = {
  indexName: z.string().describe("The name of the embeddings index to search"),
  query: z.string().describe("The query to search for"),
  maxResults: z
    .number()
    .optional()
    .describe("Maximum number of results to return"),
  filter: z
    .object({
      type: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe("Optional filter to select specific document types"),
    })
    .optional()
    .describe("Optional filters to refine search results"),
};

export const SemanticSearchParamsSchema = z.object(SemanticSearchParams);

export type SemanticSearchParamsType = z.infer<
  typeof SemanticSearchParamsSchema
>;
