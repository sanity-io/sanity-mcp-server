import type {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {Release} from '../../types/sanity.js'
import {ReleaseSchemas} from './common.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const ListReleasesToolParams = BaseToolSchema.extend({
  state: ReleaseSchemas.state.optional().default('active'),
})

type Params = z.infer<typeof ListReleasesToolParams>

const ALL_RELEASES_QUERY = 'releases::all()'
const FILTERED_RELEASES_QUERY = `${ALL_RELEASES_QUERY}[state == $state]`

export async function _tool(params: Params) {
  const client = createToolClient(params)
  const query = params.state === 'all' ? ALL_RELEASES_QUERY : FILTERED_RELEASES_QUERY
  const releases = await client.fetch<Release[]>(query, {state: params.state})

  if (!releases || releases.length === 0) {
    throw new Error(
      `No releases found${params.state !== 'all' ? ` with state '${params.state}'` : ''}`,
    )
  }

  const formattedReleases: Record<string, object> = {}

  for (const release of releases) {
    const releaseId = release.name

    formattedReleases[releaseId] = {
      id: releaseId,
      title: release.metadata?.title || 'Untitled release',
      description: release.metadata?.description,
      state: release.state,
      releaseType: release.metadata?.releaseType,
      createdAt: release._createdAt,
      publishAt: release.publishAt,
    }
  }

  return createSuccessResponse(`Found ${releases.length} releases for state "${params.state}"`, {
    releases: formattedReleases,
  })
}

export const listReleasesTool = withErrorHandling(_tool, 'Error listing releases')
