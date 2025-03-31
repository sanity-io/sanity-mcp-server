import { z } from "zod";

// Define the release type enum values
const ReleaseType = z.enum(["asap", "undecided", "scheduled"]);

// Define the metadata schema
const ReleaseMetadata = z
  .object({
    title: z.string().describe("title of the release").optional(),
    description: z.string().describe("release description").optional(),
    releaseType: ReleaseType.describe(
      "type of the release, wheter it should be schedulaed as soon as posible, undecided or scheduled",
    ).optional(),
    intendedPublishAt: z
      .string()
      .datetime()
      .optional()
      .describe("publish time if release type is scheduled"),
  })
  .refine(
    (data) => {
      // thruthy check on intendedPublishAt
      return data.releaseType === "scheduled" && data.intendedPublishAt;
    },
    {
      message: "intendedPublishAt is required when releaseType is 'scheduled'",
      path: ["intendedPublishAt"],
    },
  );

// Define the ReleaseActionBody schema
export const ReleaseActionBody = z.object({
  releaseId: z.string().describe("id for the new release"),
  metadata: ReleaseMetadata.optional().describe("meta data about the release"),
  actionType: z.string(),
});

export const Release = {
  metadata: ReleaseMetadata.optional().describe("metadata about the release"),
};

export const ReleaseParamsSchema = z.object(Release);

export type ReleaseParamsType = z.infer<typeof ReleaseParamsSchema>;

export const ReleaseDocument = {
  releaseId: z.string().describe("Document id for the sanity release document"),
  publishedId: z.string().describe("Document id for the sanity document"),
};

export const UnpublishDocument = {
  publishedId: z.string().describe("Publish id for the document to unpublish"),
  versionId: z.string().describe("Version id for the document to unpublish"),
};

export const ReleaseDocumentParamsSchema = z.object(ReleaseDocument);
export const UnpublishDocumentParamsSchema = z.object(UnpublishDocument);

export type ReleaseDocumentParamsType = z.infer<
  typeof ReleaseDocumentParamsSchema
>;

export type ReleaseActionBodyType = z.infer<typeof ReleaseActionBody>;
export type ReleaseActionRequest = Omit<ReleaseActionBodyType, "releaseId">;
export type UnpublishActionBodyType = z.infer<
  typeof UnpublishDocumentParamsSchema
>;

export const PublishMultipleDocuments = {
  publishDocuments: z
    .array(ReleaseDocumentParamsSchema)
    .min(1)
    .describe("list containing the release id and published id"),
};

export const UnpublishMultipleDocuments = {
  unpublishDocuments: z
    .array(UnpublishDocumentParamsSchema)
    .min(1)
    .describe("list containing the release id and published id"),
};

export const PublishMultipleDocumentsParamsType = z.object(
  PublishMultipleDocuments,
);

export const UnpublishMultipleDocumentsParamsType = z.object(
  UnpublishMultipleDocuments,
);

export type PublishMultiplesDocumentType = z.infer<
  typeof PublishMultipleDocumentsParamsType
>;

export type UnpublishMultiplesDocumentType = z.infer<
  typeof UnpublishMultipleDocumentsParamsType
>;
