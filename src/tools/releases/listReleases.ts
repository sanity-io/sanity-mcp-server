import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import type {Release} from '../../types/sanity.js'
import {ReleaseSchemas} from './common.js'

export const ListReleasesToolParams = z.object({
  state: ReleaseSchemas.state.optional().default('active'),
})

type Params = z.infer<typeof ListReleasesToolParams>

async function tool(params: Params) {
  const query = params.state !== 'all' ? 'releases::all()[state == $state]' : 'releases::all()'
  const releases = await sanityClient.fetch<Release[]>(query, {state: params.state})

  if (!releases || releases.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No releases found${params.state !== 'all' ? ` with state '${params.state}'` : ''}`,
        },
      ],
    }
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

export const listReleasesTool = withErrorHandling(tool, 'Error listing releases')
