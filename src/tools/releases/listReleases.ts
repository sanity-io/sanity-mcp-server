import {z} from 'zod'
import {sanityClient} from '../../config/sanity.js'
import {formatResponse} from '../../utils/formatters.js'
import type {Release} from '../../types/sanity.js'
import {ReleaseSchemas} from './common.js'

export const ListReleasesToolParams = z.object({
  state: ReleaseSchemas.state.optional().default('active'),
})

type Params = z.infer<typeof ListReleasesToolParams>

export async function listReleasesTool(params: Params) {
  try {
    const rawClient = sanityClient.withConfig({
      perspective: 'raw',
      apiVersion: '2025-02-19',
    })

    const query = params.state !== 'all' ? 'releases::all()[state == $state]' : 'releases::all()'
    const releases = await rawClient.fetch<Release[]>(query, {state: params.state})

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

    const message = formatResponse(
      `Found ${releases.length} releases for state "${params.state}"`,
      {releases: formattedReleases},
    )

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
        },
      ],
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error listing releases: ${errorMessage}`,
        },
      ],
    }
  }
}
