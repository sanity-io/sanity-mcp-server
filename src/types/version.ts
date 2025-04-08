import type {ContentObject, SanityMutationResult} from './sanity.js'

export interface CreateVersionResult {
  success: boolean
  message: string
  versionId?: string
  versionIds?: string[]
  result: SanityMutationResult
}

export interface DiscardVersionResult {
  success: boolean
  message: string
  versionId?: string
  versionIds?: string[]
  result: SanityMutationResult
}

export interface CreateVersionParams {
  releaseId: string
  documentId: string | string[]
  projectId?: string
  dataset?: string
  content?: ContentObject
}

export interface DiscardVersionParams {
  versionId: string | string[]
  projectId?: string
  dataset?: string
  purge?: boolean
}
