import {z} from 'zod'
import {getSanityConfigTool} from './getSanityConfigTool.js'
import {listDatasetsTool} from '../datasets/listDatasets.js'
import {listEmbeddingsIndicesTool} from '../embeddings/listEmbeddingsTool.js'
import {listReleasesTool} from '../releases/listReleases.js'
import {formatResponse} from '../../utils/formatters.js'
import {getSchemaTool} from '../schema/getSchemaTool.js'

export const GetInitialContextToolParams = z.object({})

type Params = z.infer<typeof GetInitialContextToolParams>

let contextInitialized = false

export function hasInitialContext(): boolean {
  return contextInitialized
}

export async function getInitialContextTool(_params: Params) {
  try {
    const [config, datasets, schema, embeddings, releases] = await Promise.all([
      getSanityConfigTool({}),
      listDatasetsTool({}),
      getSchemaTool({lite: true}),
      listEmbeddingsIndicesTool({}),
      listReleasesTool({state: 'active'}),
    ])

    contextInitialized = true

    // Collect all the information
    const contextInfo = {
      config: config.content[0].text,
      datasets: datasets.content[0].text,
      schema: schema.content[0].text,
      embeddings: embeddings.content[0].text,
      releases: releases.content[0].text,
    }

    const message = formatResponse(
      'This is the initial context for your Sanity instance',
      contextInfo,
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
          text: `Error getting initial context: ${errorMessage}`,
        },
      ],
    }
  }
}
