import {z} from 'zod'

/**
 * Parameter definitions for get_example_documents tool
 */
export const getExampleDocumentsParams = {
  type: z.enum(['blog', 'product', 'user']).describe('The type of documents to fetch'),
  limit: z.number().min(1).max(10).optional().describe('Number of documents to return (max 10)'),
}

/**
 * Zod schema for get_example_documents tool parameters
 */
export const GetExampleDocumentsSchema = z.object(getExampleDocumentsParams)
