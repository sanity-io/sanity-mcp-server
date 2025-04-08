import {z} from 'zod'

// Common dataset parameters
const datasetBaseParams = {
  name: z
    .string()
    .transform((name) => name.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
    .refine(
      (name) => name.length > 0,
      'Dataset name cannot be empty after transformation. Please include at least one letter, number, underscore, or dash.',
    )
    .describe('The name of the dataset (will be automatically formatted to match requirements)'),

  aclMode: z.enum(['private', 'public']).optional().describe('The ACL mode for the dataset'),
}

// Create dataset schema
export const createDatasetParams = {
  ...datasetBaseParams,
  name: datasetBaseParams.name.describe('The name of the dataset to create'),
}
const CreateDatasetSchema = z.object(createDatasetParams)
export type CreateDatasetParams = z.infer<typeof CreateDatasetSchema>

// Update dataset schema
export const updateDatasetParams = {
  ...datasetBaseParams,
  name: datasetBaseParams.name.describe('The name of the dataset to update'),
}
const UpdateDatasetSchema = z.object(updateDatasetParams)
export type UpdateDatasetParams = z.infer<typeof UpdateDatasetSchema>

// Delete dataset schema
export const deleteDatasetParams = {
  dataset: z
    .string()
    .transform((name) => name.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
    .refine(
      (name) => name.length > 0,
      'Dataset name cannot be empty after transformation. Please include at least one letter, number, underscore, or dash.',
    )
    .describe('The name of the dataset to delete'),
}
const DeleteDatasetSchema = z.object(deleteDatasetParams)
export type DeleteDatasetParams = z.infer<typeof DeleteDatasetSchema>
