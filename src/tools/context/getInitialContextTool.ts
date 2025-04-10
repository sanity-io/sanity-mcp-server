import {z} from 'zod'
import {outdent} from 'outdent'
import {getSanityConfigTool} from './getSanityConfigTool.js'
import {listDatasetsTool} from '../datasets/listDatasets.js'
import {listEmbeddingsIndicesTool} from '../embeddings/listEmbeddingsTool.js'
import {listReleasesTool} from '../releases/listReleases.js'
import {getSchemaTool} from '../schema/getSchemaTool.js'
import {contextStore} from './store.js'
import {withErrorHandling} from '../../utils/response.js'
import {MCP_INSTRUCTIONS} from './instructions.js'

export const GetInitialContextToolParams = z.object({})

type Params = z.infer<typeof GetInitialContextToolParams>

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext()
}

async function tool(_params: Params) {
  const [config, datasets, schema, embeddings, releases] = await Promise.all([
    getSanityConfigTool({}),
    listDatasetsTool({}),
    getSchemaTool({lite: true}),
    listEmbeddingsIndicesTool({}),
    listReleasesTool({state: 'active'}),
  ])

  const todaysDate = new Date().toLocaleDateString('en-US')

  const message = outdent`
    ${MCP_INSTRUCTIONS}

    This is the initial context for your Sanity instance:

    <context>
      ${config.content[0].text}
      ${datasets.content[0].text}
      ${schema.content[0].text}
      ${embeddings.content[0].text}
      ${releases.content[0].text}
    </content>

    <todaysDate>${todaysDate}</todaysDate>
  `

  contextStore.setInitialContextLoaded()

  return {
    content: [
      {
        type: 'text' as const,
        text: message,
      },
    ],
  }
}

export const getInitialContextTool = withErrorHandling(tool, 'Error getting initial context')
