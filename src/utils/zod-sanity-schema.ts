import {z} from 'zod'
import {type DocumentId, getPublishedId} from '@sanity/id-utils'
import type {ManifestArrayMember, ManifestField, ManifestSchemaType} from '../types/manifest.js'

export function createZodSchemaFromSanitySchema(sanitySchema: ManifestSchemaType[]) {
  const schemaMap = new Map<string, ManifestSchemaType>()
  for (const schema of sanitySchema) {
    schemaMap.set(schema.name, schema)
  }

  // Build Zod schemas for each type
  const zodSchemas = new Map<string, z.ZodTypeAny>()

  for (const schema of sanitySchema) {
    zodSchemas.set(schema.name, createZodTypeFromSanityType(schema, schemaMap, zodSchemas))
  }

  return Object.fromEntries(zodSchemas)
}

function createZodTypeFromSanityType(
  schema: ManifestSchemaType,
  schemaMap: Map<string, ManifestSchemaType>,
  zodSchemas: Map<string, z.ZodTypeAny>,
): z.ZodTypeAny {
  // If we've already processed this schema, return the cached result
  if (zodSchemas.has(schema.name)) {
    const existingSchema = zodSchemas.get(schema.name)
    if (existingSchema) return existingSchema
  }

  // Create a placeholder to handle circular references
  const lazySchema = z.lazy(() => createActualZodType(schema, schemaMap, zodSchemas))
  zodSchemas.set(schema.name, lazySchema)

  return lazySchema
}

function createActualZodType(
  schema: ManifestSchemaType,
  schemaMap: Map<string, ManifestSchemaType>,
  zodSchemas: Map<string, z.ZodTypeAny>,
): z.ZodTypeAny {
  switch (schema.type) {
    case 'document':
      return createDocumentSchema(schema, schemaMap, zodSchemas)

    case 'object':
      return createObjectSchema(schema, schemaMap, zodSchemas)

    case 'array':
      return createArraySchema(schema, schemaMap, zodSchemas)

    default:
      return convertBasicType(schema.type, false)
  }
}

/**
 * Type helpers
 */
function createDocumentSchema(
  schema: ManifestSchemaType,
  schemaMap: Map<string, ManifestSchemaType>,
  zodSchemas: Map<string, z.ZodTypeAny>,
): z.ZodTypeAny {
  const fields: Record<string, z.ZodTypeAny> = {
    _id: z.string(),
    _type: z.literal(schema.name),
    _rev: z.string().optional(),
    _createdAt: z.string().datetime().optional(),
    _updatedAt: z.string().datetime().optional(),
  }

  if (schema.fields) {
    for (const field of schema.fields) {
      fields[field.name] = getFieldSchema(field, schemaMap, zodSchemas).optional()
    }
  }

  return z.object(fields)
}

function createObjectSchema(
  schema: ManifestSchemaType,
  schemaMap: Map<string, ManifestSchemaType>,
  zodSchemas: Map<string, z.ZodTypeAny>,
): z.ZodTypeAny {
  const fields: Record<string, z.ZodTypeAny> = {
    _type: z.literal(schema.name),
  }

  if (schema.fields) {
    for (const field of schema.fields) {
      fields[field.name] = getFieldSchema(field, schemaMap, zodSchemas).optional()
    }
  }

  return z.object(fields)
}

function createArraySchema(
  schema: ManifestSchemaType,
  schemaMap: Map<string, ManifestSchemaType>,
  zodSchemas: Map<string, z.ZodTypeAny>,
): z.ZodTypeAny {
  if (!schema.of || schema.of.length === 0) {
    return z.array(z.unknown())
  }

  const unionTypes = schema.of.map((item) => getFieldSchema(item, schemaMap, zodSchemas))
  if (unionTypes.length < 2) {
    return z.array(unionTypes[0] || z.unknown())
  }

  return z.array(z.union(unionTypes as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]))
}

function getFieldSchema(
  field: ManifestField | ManifestArrayMember,
  schemaMap: Map<string, ManifestSchemaType>,
  zodSchemas: Map<string, z.ZodTypeAny>,
): z.ZodTypeAny {
  // First check if field.type is defined and a string
  const fieldType = typeof field.type === 'string' ? field.type : undefined

  // If it's a reference to another type in the schema
  if (fieldType && schemaMap.has(fieldType)) {
    const referencedSchema = schemaMap.get(fieldType)
    if (referencedSchema)
      return createZodTypeFromSanityType(referencedSchema, schemaMap, zodSchemas)
  }

  if (fieldType === 'block') {
    return createBlockContentSchema(field as ManifestSchemaType)
  }

  switch (fieldType) {
    case 'array':
      return createArraySchema(field as ManifestSchemaType, schemaMap, zodSchemas)
    case 'object':
      return createObjectSchema(field as ManifestSchemaType, schemaMap, zodSchemas)
    case 'reference':
      return convertReferenceType(true) // Pass true to use the transform for fields
    case 'image':
      return convertImageType()
    default:
      return convertBasicType(fieldType, true)
  }
}

function convertBasicType(type: string | undefined, isField: boolean): z.ZodTypeAny {
  switch (type) {
    case 'string':
      return z.string()
    case 'text':
      return z.string()
    case 'url':
      return z.string().url()
    case 'datetime':
      return z.string().datetime()
    case 'slug':
      return z.object({
        current: z.string(),
        _type: z.literal('slug'),
      })
    case 'reference':
      return convertReferenceType(isField)
    case 'image':
      return convertImageType()
    default:
      return z.unknown()
  }
}

function convertReferenceType(transformId: boolean): z.ZodTypeAny {
  const refSchema = z.string()

  // Only apply the transform for field references, not for top-level schema types
  const refWithTransform = transformId
    ? refSchema.transform((id) => getPublishedId(id as DocumentId))
    : refSchema

  return z.object({
    _ref: refWithTransform,
    _type: z.literal('reference'),
  })
}

function convertImageType(): z.ZodTypeAny {
  return z.object({
    _type: z.literal('image'),
    asset: z.object({
      _ref: z.string().regex(/^image-[a-zA-Z0-9]+(-\d+x\d+-[a-z]+)?$/, {
        message:
          "Image reference must be in the format 'image-[id]' or 'image-[id]-[dimensions]-[format]'",
      }),
      _type: z.literal('reference'),
    }),
  })
}

function createBlockContentSchema(_blockConfig: ManifestSchemaType): z.ZodTypeAny {
  // Basic structure for block content
  const blockSchema = z.object({
    _type: z.literal('block'),
    style: z.string(),
    markDefs: z
      .array(
        z
          .object({
            _type: z.string(),
          })
          .passthrough(),
      )
      .optional(),
    children: z.array(
      z
        .object({
          _type: z.string(),
          text: z.string().optional(),
          marks: z.array(z.string()).optional(),
        })
        .passthrough(),
    ),
  })

  return blockSchema
}
