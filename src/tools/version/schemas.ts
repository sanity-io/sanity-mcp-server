import { z } from "zod";

// Define ContentValue schema recursively
const contentValueSchema: z.ZodType<any> = z.lazy(() => 
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ _ref: z.string(), _weak: z.boolean().optional() }),
    z.instanceof(Date),
    z.null(),
    z.undefined(),
    z.record(contentValueSchema),
    z.array(contentValueSchema)
  ])
);

export const createDocumentVersionSchema = {
  releaseId: z.string().describe('ID of the release to add the document version to'),
  documentId: z.union([z.string(), z.array(z.string())]).describe('ID or array of IDs of the document(s) to create a version of'),
  projectId: z.string().optional().describe(
    'Project ID, if not provided will use the project ID from the environment'
  ),
  dataset: z.string().optional().describe(
    'Dataset name, if not provided will use the dataset from the environment'
  ),
  content: z.record(contentValueSchema).optional().describe('Optional content to use for the version')
};

export const discardDocumentVersionSchema = {
  versionId: z.union([z.string(), z.array(z.string())]).describe('ID or array of IDs of the version(s) to discard'),
  projectId: z.string().optional().describe(
    'Project ID, if not provided will use the project ID from the environment'
  ),
  dataset: z.string().optional().describe(
    'Dataset name, if not provided will use the dataset from the environment'
  ),
  purge: z.boolean().optional().describe('Whether to completely remove from history')
}; 