import { z } from "zod";

export const GetSchemaParams = {
  type: z.string().describe("Type for the schema to fetch"),
};

export const GetSchemaParamsSchema = z.object(GetSchemaParams);

export type GetSchemaParamsType = z.infer<typeof GetSchemaParamsSchema>;
