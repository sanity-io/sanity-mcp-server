import type {DocumentId} from '@sanity/id-utils'
import type {CreationCheckpoint, MutationCheckpoint} from '../types/checkpoint.js'
import type {SanityClient} from '@sanity/client'
import {getDocument} from './document.js'

function getCheckpointResource(client: SanityClient) {
  const {projectId, dataset} = client.config()
  if (!projectId) {
    throw new Error('Project ID is not configured')
  }
  if (!dataset) {
    throw new Error('Dataset is not configured')
  }
  return {projectId, dataset}
}

export function getCreationCheckpoint(
  documentId: DocumentId,
  client: SanityClient,
): CreationCheckpoint {
  const {projectId, dataset} = getCheckpointResource(client)

  return {
    type: 'create',
    projectId,
    dataset,
    _id: documentId,
  }
}

export async function getMutationCheckpoint(
  documentId: DocumentId,
  client: SanityClient,
): Promise<MutationCheckpoint> {
  const {projectId, dataset} = getCheckpointResource(client)

  const document = await getDocument(documentId, client)

  return {
    type: 'mutate',
    projectId,
    dataset,
    _id: document._id,
    _rev: document._rev,
  }
}
