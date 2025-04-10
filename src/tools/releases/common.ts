import {z} from 'zod'

/**
 * Common schema types used across release tools
 */
export const ReleaseSchemas = {
  releaseId: z.string().describe('ID of the release'),

  title: z.string().describe('Title for the release (e.g., "Spring 2025 Product Launch")'),

  description: z.string().describe('Description for the release'),

  releaseType: z
    .enum(['asap', 'undecided', 'scheduled'])
    .describe('Type of release (asap, undecided, scheduled)'),

  publishDate: z
    .string()
    .describe(
      'Date can be ISO format (2025-04-04T18:36:00.000Z) or natural language like "in two weeks"',
    ),

  state: z
    .enum(['active', 'scheduled', 'published', 'archived', 'deleted', 'all'])
    .describe('Filter releases by state (active, scheduled, published, archived, deleted, or all)'),
}
