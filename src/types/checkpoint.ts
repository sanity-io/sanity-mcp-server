interface CheckpointBase {
  projectId: string
  dataset: string
  _id: string
}

export interface CreationCheckpoint extends CheckpointBase {
  type: 'create'
}

export interface MutationCheckpoint extends CheckpointBase {
  type: 'mutate'
  _rev: string
}

export type Checkpoint = CreationCheckpoint | MutationCheckpoint
