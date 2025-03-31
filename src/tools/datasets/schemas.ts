import { z } from "zod";

// Common dataset parameters
const datasetBaseParams = {
  name: z
    .string()
    .regex(
      /^[a-z0-9_-]+$/,
      "The name of the dataset can only contain lowercase characters, numbers, underscores and dashes"
    )
    .describe("The name of the dataset"),

  aclMode: z
    .enum(["private", "public"])
    .optional()
    .describe("The ACL mode for the dataset"),
} as const;

// Create dataset schema
export const createDatasetParams = {
  ...datasetBaseParams,
  name: datasetBaseParams.name.describe("The name of the dataset to create"),
};
const CreateDatasetSchema = z.object(createDatasetParams);
export type CreateDatasetParams = z.infer<typeof CreateDatasetSchema>;

// Update dataset schema
export const updateDatasetParams = {
  ...datasetBaseParams,
  name: datasetBaseParams.name.describe("The name of the dataset to update"),
};
const UpdateDatasetSchema = z.object(updateDatasetParams);
export type UpdateDatasetParams = z.infer<typeof UpdateDatasetSchema>;

// Delete dataset schema
export const deleteDatasetParams = {
  dataset: z.string().describe("The name of the dataset to delete"),
} as const;
const DeleteDatasetSchema = z.object(deleteDatasetParams);
export type DeleteDatasetParams = z.infer<typeof DeleteDatasetSchema>;
