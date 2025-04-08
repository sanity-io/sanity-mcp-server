import {z} from 'zod'

export const GetSchemaParams = {
  type: z.string().describe('Name of the _type for the document to fetch'),
  schemaId: z.string().optional().describe('The schema ID to fetch'),
}
