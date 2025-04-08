import {XMLBuilder} from 'fast-xml-parser'

export function formatResponse(
  message: string | null,
  object: Record<string, unknown> = {},
): string {
  const formattedObject: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(object)) {
    if (!value) continue
    formattedObject[key] = value
  }

  const builder = new XMLBuilder({
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
  })

  const contextString = builder.build(formattedObject)

  return `${contextString}\n${message}`.trim()
}
