import {sanityClient} from '../config/sanity.js'
import type {ManifestSchemaType} from '../types/manifest.js'

export const DEFAULT_SCHEMA_ID = 'sanity.workspace.schema.default'

export async function getSchemaById(schemaId: string): Promise<ManifestSchemaType[]> {
  const res = await sanityClient.fetch('*[_id == $schemaId][0]', {
    schemaId,
  })

  if (!res.schema) {
    throw new Error(
      `Schema not found for id: ${schemaId}. Run list_schema_ids to find available schemas.`,
    )
  }

  return JSON.parse(res.schema) as ManifestSchemaType[]
}
