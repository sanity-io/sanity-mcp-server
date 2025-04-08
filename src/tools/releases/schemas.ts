import {z} from 'zod'

// Define the release type enum values
const ReleaseType = z.enum(['asap', 'undecided', 'scheduled'])

export const ListReleaseDocumentsParams = {
  includeAll: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, list all releases, otherwise list only active releases'),
}

export const ListReleaseDocumentsParamsSchema = z.object(ListReleaseDocumentsParams)

export type ListReleaseDocumentsParamsType = z.infer<typeof ListReleaseDocumentsParamsSchema>

const ReleaseMetadataInformation = z.object({
  title: z.string().describe('title of the release').optional(),
  description: z.string().describe('release description').optional(),
})

// Define the metadata schema
const ReleaseMetadata = z
  .object({
    title: z.string().describe('title of the release').optional(),
    description: z.string().describe('release description').optional(),
    releaseType: ReleaseType.describe(
      'type of the release, wheter it should be schedulaed asap, undecided or scheduled. You should use undecided if no other is specified',
    ).optional(),
    intendedPublishAt: z
      .string()
      .datetime()
      .optional()
      .describe('publish time if release type is scheduled'),
  })
  .refine((data) => !(data.releaseType === 'scheduled' && !data.intendedPublishAt), {
    message: "intendedPublishAt is required when releaseType is 'scheduled'",
    path: ['intendedPublishAt'],
  })
export type ReleaseMetadataType = z.infer<typeof ReleaseMetadata>

// Define the ReleaseActionBody schema
export const ReleaseActionBody = z.object({
  releaseId: z.string().describe('id for the new release'),
  metadata: ReleaseMetadata.optional().describe('meta data about the release'),
  actionType: z.string(),
})

export const Release = {
  metadata: ReleaseMetadata.optional().describe('metadata about the release'),
}

export const ReleaseMetadataUpdate = {
  releaseId: z.string(),
  metadata: ReleaseMetadataInformation.describe('metadata to be updated on the release').refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one metadata field must be provided.',
    },
  ),
}

export const RemoveDocumentFromRelease = {
  releaseId: z.string().describe('id of the release'),
  publishedId: z.string().describe('id of the document we want to discard'),
}

export const DiscardDocParamsSchema = z.object(RemoveDocumentFromRelease)
export const ReleaseMetadataParamsSchema = z.object(ReleaseMetadataUpdate)

export type DiscardDocParamsType = z.infer<typeof DiscardDocParamsSchema>

export const ReleaseParamsSchema = z.object(Release)

export type ReleaseParamsType = z.infer<typeof ReleaseParamsSchema>
export type ReleaseMetadataUpdateType = z.infer<typeof ReleaseMetadataParamsSchema>

export const ReleaseDocument = {
  releaseId: z.string().describe('Document id for the sanity release document'),
  publishedId: z.string().describe('Document id for the sanity document'),
}

export const UnpublishDocument = {
  publishedId: z.string().describe('Publish id for the document to unpublish'),
  versionId: z.string().describe('Version id for the document to unpublish'),
}

export const ReleaseDocumentParamsSchema = z.object(ReleaseDocument)
export const UnpublishDocumentParamsSchema = z.object(UnpublishDocument)

export type ReleaseDocumentParamsType = z.infer<typeof ReleaseDocumentParamsSchema>

export type ReleaseActionBodyType = z.infer<typeof ReleaseActionBody>
export type ReleaseActionRequest = Omit<ReleaseActionBodyType, 'releaseId'>
export type UnpublishActionBodyType = z.infer<typeof UnpublishDocumentParamsSchema>

export const PublishMultipleDocuments = {
  publishDocuments: z
    .array(ReleaseDocumentParamsSchema)
    .min(1)
    .describe('list containing the release id and published id'),
}

export const UnpublishMultipleDocuments = {
  unpublishDocuments: z
    .array(UnpublishDocumentParamsSchema)
    .min(1)
    .describe('list containing the release id and published id'),
}

export const PublishMultipleDocumentsParamsType = z.object(PublishMultipleDocuments)

export const UnpublishMultipleDocumentsParamsType = z.object(UnpublishMultipleDocuments)

export type PublishMultiplesDocumentType = z.infer<typeof PublishMultipleDocumentsParamsType>

export type UnpublishMultiplesDocumentType = z.infer<typeof UnpublishMultipleDocumentsParamsType>
