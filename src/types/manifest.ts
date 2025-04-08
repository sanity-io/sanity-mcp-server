export type ManifestSerializable =
  | string
  | number
  | boolean
  | {[k: string]: ManifestSerializable}
  | ManifestSerializable[]

export type SchemaFile = `${string}.create-schema.json`

export interface StudioManifest {
  version: 1
  createdAt: string
  workspaces: SerializedManifestWorkspace[]
}

export interface SerializedManifestWorkspace {
  name: string
  title: string
  subtitle?: string
  basePath: `/${string}`
  dataset: string
  schema: SchemaFile
}

export interface ManifestSchemaType {
  type: string
  name: string
  title?: string
  deprecated?: {
    reason: string
  }
  readOnly?: boolean | 'conditional'
  hidden?: boolean | 'conditional'
  validation?: ManifestValidationGroup[]
  fields?: ManifestField[]
  to?: ManifestReferenceMember[]
  of?: ManifestArrayMember[]
  preview?: {
    select: Record<string, string>
  }
  fieldsets?: ManifestFieldset[]
  options?: Record<string, ManifestSerializable>
  //portable text
  marks?: {
    annotations?: ManifestArrayMember[]
    decorators?: ManifestTitledValue[]
  }
  lists?: ManifestTitledValue[]
  styles?: ManifestTitledValue[]

  // userland (assignable to ManifestSerializable | undefined)
  [index: string]: unknown
}

export interface ManifestFieldset {
  name: string
  title?: string
  [index: string]: ManifestSerializable | undefined
}

export interface ManifestTitledValue {
  value: string
  title?: string
}

export type ManifestField = ManifestSchemaType & {fieldset?: string}
export type ManifestArrayMember = Omit<ManifestSchemaType, 'name'> & {
  name?: string
}
export type ManifestReferenceMember = Omit<ManifestSchemaType, 'name'> & {
  name?: string
}

export interface ManifestValidationGroup {
  rules: ManifestValidationRule[]
  message?: string
  level?: 'error' | 'warning' | 'info'
}

export type ManifestValidationRule = {
  flag: 'presence' | string
  constraint?: 'required' | ManifestSerializable
  [index: string]: ManifestSerializable | undefined
}
