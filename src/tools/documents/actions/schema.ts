import {z} from 'zod'

export const PublishDocument = {
  draftId: z.string().describe('Document id for the sanity document'),
  publishId: z.string().describe('Document id for the sanity document'),
}

export const PublishDocuments = {
  publishIds: z
    .array(z.object(PublishDocument))
    .describe('Draft ids and publish ids for the documents to publish '),
}

export const PublishDocumentParamsSchema = z.object(PublishDocument)
export const PublishDocumentsParamsSchema = z.object(PublishDocuments)

export type PublishDocumentParamsType = z.infer<typeof PublishDocumentParamsSchema>

export type PublishDocumentsParamsType = z.infer<typeof PublishDocumentsParamsSchema>
