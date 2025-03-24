import { z } from "zod";

/**
 * Base mutation options schema matching Sanity's BaseMutationOptions
 */
const BaseMutationOptionsSchema = z.object({
  visibility: z.enum(['sync', 'async', 'deferred'])
    .optional()
    .describe("Visibility mode for the mutation"),
  
  returnDocuments: z.boolean()
    .optional()
    .describe("Whether to return the created/modified documents"),
  
  returnFirst: z.boolean()
    .optional()
    .describe("Whether to return only the first document"),
  
  dryRun: z.boolean()
    .optional()
    .describe("Whether to perform a dry run without actually modifying data"),
  
  autoGenerateArrayKeys: z.boolean()
    .optional()
    .describe("Whether to automatically generate keys for array items"),
  
  skipCrossDatasetReferenceValidation: z.boolean()
    .optional()
    .describe("Whether to skip validation of cross-dataset references"),
  
  transactionId: z.string()
    .optional()
    .describe("ID of the transaction this mutation is part of"),
  
  // From RequestOptions
  timeout: z.number()
    .optional()
    .describe("Timeout in milliseconds for the operation"),
  
  token: z.string()
    .optional()
    .describe("Authentication token to use for this request"),
  
  tag: z.string()
    .optional()
    .describe("Tag for the request"),
  
  headers: z.record(z.string())
    .optional()
    .describe("Additional headers for the request"),
});

/**
 * Schema for creating a new document
 */
export const createDocumentParams = {
  document: z.object({
    _type: z.string().describe("The type of document to create")
  }).catchall(z.any())
    .describe("The document to create. Must include _type field and can include any other fields."),
  
  options: BaseMutationOptionsSchema
    .optional()
    .describe("Additional options for the create operation")
};

/**
 * Schema for creating multiple documents
 */
export const createMultipleDocumentsParams = {
  documents: z.array(
    z.object({
      _type: z.string().describe("The type of document to create")
    }).catchall(z.any())
  ).describe("Array of documents to create. Each document must include _type field."),
  
  options: BaseMutationOptionsSchema
    .optional()
    .describe("Additional options for the create operation")
};

/**
 * Schema for patch operations in Sanity
 */
const PatchOperationsSchema = z.object({
  // Set fields to specific values
  set: z.record(z.any())
    .optional()
    .describe("Set fields to specific values"),
  
  // Set fields only if they're not already present
  setIfMissing: z.record(z.any())
    .optional()
    .describe("Set fields only if they're not already present"),
  
  // Unset/remove specific fields
  unset: z.array(z.string())
    .optional()
    .describe("Remove specific fields from the document"),
  
  // Increment numeric fields
  inc: z.record(z.number())
    .optional()
    .describe("Increment numeric fields by the specified amount"),
  
  // Decrement numeric fields
  dec: z.record(z.number())
    .optional()
    .describe("Decrement numeric fields by the specified amount"),
  
  // Only perform patch if document has this revision
  ifRevisionId: z.string()
    .optional()
    .describe("Only perform the patch if document has this revision ID"),
}).refine(
  data => Object.keys(data).length > 0,
  "At least one patch operation must be specified"
);

/**
 * Schema for updating an existing document
 */
export const patchDocumentParams = {
  // The document ID to update
  id: z.string()
    .describe("The ID of the document to update"),
  
  // The patch operations to perform
  patch: PatchOperationsSchema
    .describe("The patch operations to perform on the document"),
    
  options: BaseMutationOptionsSchema
    .optional()
    .describe("Additional options for the update operation")
};

/**
 * Schema for patching multiple documents
 */
export const patchMultipleDocumentsParams = {
  // Either provide an array of IDs or a GROQ query
  ids: z.array(z.string())
    .optional()
    .describe("Array of document IDs to patch"),
  
  query: z.string()
    .optional()
    .describe("GROQ query to select documents to patch"),
  
  params: z.record(z.any())
    .optional()
    .describe("Parameters for the GROQ query"),

  // The patch operations to perform
  patch: PatchOperationsSchema
    .describe("The patch operations to perform on the documents"),
    
  options: BaseMutationOptionsSchema
    .optional()
    .describe("Additional options for the patch operation")
};

/**
 * Schema for deleting a document
 */
export const deleteDocumentParams = {
  id: z.string()
    .describe("The ID of the document to delete"),
    
  options: BaseMutationOptionsSchema
    .optional()
    .describe("Additional options for the delete operation")
};

/**
 * Schema for deleting multiple documents
 */
export const deleteMultipleDocumentsParams = {
  // Either provide an array of IDs or a GROQ query
  ids: z.array(z.string())
    .optional()
    .describe("Array of document IDs to delete"),
  
  query: z.string()
    .optional()
    .describe("GROQ query to select documents to delete"),
  
  params: z.record(z.any())
    .optional()
    .describe("Parameters for the GROQ query"),

  options: BaseMutationOptionsSchema
    .optional()
    .describe("Additional options for the delete operation")
};

export const modifyMultipleDocumentsParams = {
  mutations: z.array(z.object({
    operation: z.enum(['create', 'createOrReplace', 'createIfNotExists', 'patch', 'delete']),
    document: z.object({
      _id: z.string(),
      _type: z.string()
    }).passthrough(),
    patch: z.object({
      set: z.record(z.any()).optional(),
      setIfMissing: z.record(z.any()).optional(),
      unset: z.array(z.string()).optional(),
      inc: z.record(z.number()).optional(),
      dec: z.record(z.number()).optional(),
      ifRevisionId: z.string().optional()
    }).optional()
  })).min(1),
  
  options: BaseMutationOptionsSchema
    .optional()
    .describe("Additional options for the transaction")
};

// Create the full schemas from the params for type inference
const CreateDocumentSchema = z.object(createDocumentParams);
const CreateMultipleDocumentsSchema = z.object(createMultipleDocumentsParams);
const PatchDocumentSchema = z.object(patchDocumentParams);
const PatchMultipleDocumentsSchema = z.object(patchMultipleDocumentsParams)
  .refine(
    (data) => !!(data.ids || data.query),
    "Either ids or query must be provided"
  ).refine(
    (data) => !(data.ids && data.query),
    "Cannot provide both ids and query"
  ).refine(
    (data) => !(data.query && !data.params && data.query.includes('$')),
    "Query contains parameters but no params object was provided"
  );
const DeleteDocumentSchema = z.object(deleteDocumentParams);
const DeleteMultipleDocumentsSchema = z.object(deleteMultipleDocumentsParams)
  .refine(
    (data) => !!(data.ids || data.query),
    "Either ids or query must be provided"
  ).refine(
    (data) => !(data.ids && data.query),
    "Cannot provide both ids and query"
  ).refine(
    (data) => !(data.query && !data.params && data.query.includes('$')),
    "Query contains parameters but no params object was provided"
  );

// Create schema for type inference
const ModifyMultipleDocumentsSchema = z.object(modifyMultipleDocumentsParams);

/**
 * Type for create document parameters
 */
export type CreateDocumentParams = z.infer<typeof CreateDocumentSchema>;

/**
 * Type for create multiple documents parameters
 */
export type CreateMultipleDocumentsParams = z.infer<typeof CreateMultipleDocumentsSchema>;

/**
 * Type for update document parameters
 */
export type PatchDocumentParams = z.infer<typeof PatchDocumentSchema>;

/**
 * Type for patch multiple documents parameters
 */
export type PatchMultipleDocumentsParams = z.infer<typeof PatchMultipleDocumentsSchema>;

/**
 * Type for delete document parameters
 */
export type DeleteDocumentParams = z.infer<typeof DeleteDocumentSchema>;

/**
 * Type for delete multiple documents parameters
 */
export type DeleteMultipleDocumentsParams = z.infer<typeof DeleteMultipleDocumentsSchema>;

export type ModifyMultipleDocumentsParams = z.infer<typeof ModifyMultipleDocumentsSchema>; 