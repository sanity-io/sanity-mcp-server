import {sanityClient} from '../../config/sanity.js'
import {getSanityConfigTool} from '../config/getSanityConfigTool.js'
import {getDatasetsTool} from '../datasets/getDatasetsTool.js'
import {listEmbeddingsIndicesTool} from '../embeddings/listEmbeddingsTool.js'
import {listReleases} from '../releases/listReleaseDocuments.js'
import {getSchemaOverview} from '../schema/getSchemaOverviewTool.js'
import {outdent} from 'outdent'
let contextInitialized = false

export function hasInitialContext(): boolean {
  return contextInitialized
}

export async function getInitialContextTool() {
  try {
    const [config, datasets, schemaTypes, embeddings, activeReleases] = await Promise.all([
      getSanityConfigTool(),
      getDatasetsTool(),
      getSchemaOverview({lite: true}),
      listEmbeddingsIndicesTool(),
      listReleases(sanityClient),
    ])
    const schemaTypesText = [
      'Overview of the of available schema types and its fields:',
      JSON.stringify(schemaTypes, null, 1),
      'If you need more information about a specific schema type, you can use the `get_schema_overview` tool.',
    ].join('\n\n')

    const activeReleasesText = JSON.stringify(activeReleases)

    contextInitialized = true

    const outputText = outdent`
      Sanity MCP Server:

      CONFIG & DATASETS
      ${config.content[0].text}
      ${datasets.content[0].text}

      SCHEMA:
      ${schemaTypesText}

      EMBEDDINGS:
      ${embeddings.content[0].text}

      ACTIVE RELEASES: ${activeReleasesText}
    `

    return {
      content: [
        {
          type: 'text' as const,
          text: outputText,
        },
      ],
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error getting context: ${error}`,
        },
      ],
    }
  }
}
