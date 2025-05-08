export interface EmbeddingsIndex {
  status: string
  indexName: string
  projectId: string
  dataset: string
  projection: string
  filter: string
  createdAt: string
  updatedAt: string
  failedDocumentCount: number
  startDocumentCount: number
  remainingDocumentCount: number
  webhookId: string
}

export interface EmbeddingsQueryResultItem {
  score: number
  value: {
    documentId: string
    type: string
  }
}

export interface SanityApplication {
  id: string
  projectId: string
  organizationId: string | null
  title: string | null
  type: string
  urlType: string
  appHost: string
  dashboardStatus: string
  createdAt: string
  updatedAt: string
  activeDeployment: string | null
  manifest: string | null
}

export interface DocumentBase {
  _id: string
  _type: string
}

export interface DocumentLike extends DocumentBase {
  [key: string]: unknown
}

export interface ReleaseMetadata {
  releaseType?: 'asap' | 'undecided' | 'scheduled'
  title?: string
  description?: string
  intendedPublishAt?: string
}

export interface Release {
  _createdAt: string
  _updatedAt: string
  _type: 'system.release'
  _id: string
  _rev: string
  name: string
  state: 'active' | 'scheduled' | 'published' | 'archived' | 'deleted'
  metadata: ReleaseMetadata
  publishAt: string | null
  finalDocumentStates: Array<{id: string; _key?: string}> | null
  userId: string
}

export type SchemaId = `_.schemas.${string}`
