import {ManifestSchemaType, ManifestSerializable} from './schema.js'

interface SchemaXmlNode {
  [key: string]:
    | ManifestSerializable
    | undefined
    | {[key: string]: ManifestSerializable | undefined}
    | Array<{[key: string]: ManifestSerializable | undefined}>
    | SchemaXmlNode
    | SchemaXmlNode[]
}

interface FormatOptions {
  lite?: boolean
}

interface SchemaOverview {
  totalTypes: number
  typesSummary: {
    type: {
      name: string
      type: string
      title: string | undefined
      fieldsCount: number
      description: string
    }[]
  }
}

interface SchemaDetails {
  types: SchemaXmlNode[]
}

export interface Schema {
  schemaOverview: SchemaOverview
  schemaDetails?: SchemaDetails
}

/**
 * Generate a concise overview of the schema types
 *
 * @param schema The schema to format
 * @param options Configuration options
 * @param options.lite If true, only include the schema overview without details about the fields
 */
export function generateSchemaOverview(
  schema: ManifestSchemaType[],
  options?: FormatOptions,
): Schema {
  // Filter out types that start with "sanity."
  const filteredSchema = schema.filter((documentOrObject) =>
    ['sanity.', 'assist.'].every((prefix) => !documentOrObject.type.startsWith(prefix)),
  )

  // Create a schema overview section
  const schemaOverview: SchemaOverview = {
    totalTypes: filteredSchema.length,
    typesSummary: {
      type: filteredSchema.map((type) => ({
        name: type.name,
        type: type.type,
        title: type.title,
        fieldsCount: type.fields?.length || 0,
        description: getTypeDescription(type),
      })),
    },
  }

  const schemaObject: Schema = {
    schemaOverview: schemaOverview,
    ...(options?.lite === false && {
      schemaDetails: {
        types: filteredSchema.map(formatTypeAsObject),
      },
    }),
  }

  return schemaObject
}

/**
 * Generate a concise description of a schema type
 */
function getTypeDescription(type: ManifestSchemaType): string {
  const parts: string[] = []

  if (type.type === 'document') {
    parts.push('Document type')
  } else if (type.type === 'object') {
    parts.push('Object type')
  } else if (type.type === 'array') {
    const ofTypes = type.of?.map((t) => t.type).join(', ')
    parts.push(`Array of [${ofTypes || 'unknown'}]`)
  } else {
    parts.push(`${type.type} type`)
  }

  if (type.fields?.length) {
    parts.push(`with ${type.fields.length} field${type.fields.length === 1 ? '' : 's'}`)
  }

  if (type.deprecated) {
    parts.push(`(DEPRECATED) – ${type.deprecated.reason}`)
  }

  return parts.join(' ')
}

/**
 * Convert a schema type to a plain object structure for XML serialization
 */
function formatTypeAsObject(type: ManifestSchemaType): SchemaXmlNode {
  const result: SchemaXmlNode = {
    name: type.name,
    type: type.type,
  }

  if (type.title) {
    result.title = type.title
  }

  if (type.deprecated) {
    result.deprecated = {reason: type.deprecated.reason}
  }

  if (type.readOnly !== undefined) {
    result.readOnly = type.readOnly
  }

  if (type.hidden !== undefined) {
    result.hidden = type.hidden
  }

  // Document fields
  if (type.fields && type.fields.length > 0) {
    result.fields = {
      field: type.fields.map(formatFieldAsObject),
    }
  }

  // Fieldsets
  if (type.fieldsets && type.fieldsets.length > 0) {
    result.fieldsets = {
      fieldset: type.fieldsets.map((fieldset) => ({
        name: fieldset.name,
        title: fieldset.title,
      })),
    }
  }

  // Array members
  if (type.of && type.of.length > 0) {
    result.of = {
      type: type.of.map(formatArrayMemberAsObject),
    }
  }

  // References
  if (type.to && type.to.length > 0) {
    result.to = {
      reference: type.to.map(formatArrayMemberAsObject),
    }
  }

  // Preview config
  if (type.preview) {
    result.preview = {
      select: Object.entries(type.preview.select).map(([key, value]) => ({
        field: key,
        path: value,
      })),
    }
  }

  // Portable Text specifics
  if (type.marks) {
    result.marks = {}

    if (type.marks.annotations) {
      result.marks.annotations = {
        annotation: type.marks.annotations.map(formatArrayMemberAsObject),
      }
    }

    if (type.marks.decorators) {
      result.marks.decorators = {
        decorator: type.marks.decorators.map((dec) => ({
          value: dec.value,
          title: dec.title,
        })),
      }
    }
  }

  if (type.lists) {
    result.lists = {
      list: type.lists.map((list) => ({
        value: list.value,
        title: list.title,
      })),
    }
  }

  if (type.styles) {
    result.styles = {
      style: type.styles.map((style) => ({
        value: style.value,
        title: style.title,
      })),
    }
  }

  // Options
  if (type.options && Object.keys(type.options).length > 0) {
    result.options = {}

    // Convert options to a flat structure
    for (const [key, value] of Object.entries(type.options)) {
      // Convert complex values to strings to avoid XML serialization issues
      if (typeof value === 'object' && value !== null) {
        result.options[key] = JSON.stringify(value)
      } else {
        result.options[key] = value
      }
    }
  }

  // Validation
  if (type.validation && type.validation.length > 0) {
    result.validation = {
      rule: type.validation.flatMap((group) => {
        return group.rules.map((rule) => ({
          flag: rule.flag,
          constraint:
            typeof rule.constraint === 'object' ? JSON.stringify(rule.constraint) : rule.constraint,
          message: group.message,
          level: group.level,
        }))
      }),
    }
  }

  return result
}

/**
 * Format a field as an object
 */
function formatFieldAsObject(field: ManifestSchemaType & {fieldset?: string}): SchemaXmlNode {
  const result = formatTypeAsObject(field)

  if (field.fieldset) {
    result.fieldset = field.fieldset
  }

  return result
}

/**
 * Format an array member as an object
 */
function formatArrayMemberAsObject(
  member: Omit<ManifestSchemaType, 'name'> & {name?: string},
): SchemaXmlNode {
  return formatTypeAsObject(member as ManifestSchemaType)
}
