import {z} from 'zod'
import {outdent} from 'outdent'
import {listDatasetsTool} from '../datasets/listDatasets.js'
import {listEmbeddingsIndicesTool} from '../embeddings/listEmbeddingsTool.js'
import {listReleasesTool} from '../releases/listReleases.js'
import {contextStore} from './store.js'
import {withErrorHandling} from '../../utils/response.js'
import {MCP_INSTRUCTIONS} from './instructions.js'
import {BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const GetInitialContextToolParams = z.object({}).merge(BaseToolSchema)

type Params = z.infer<typeof GetInitialContextToolParams>

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext()
}

async function tool(params: Params) {
  const client = createToolClient(params)
  const config = client.config()
  const configInfo = `Current Sanity Configuration:
  - Project ID: ${config.projectId}
  - Dataset: ${config.dataset}
  - API Version: ${config.apiVersion}
  - Using CDN: ${config.useCdn}
  - Perspective: ${config.perspective || 'default'}`

  const [datasets, embeddings, releases] = await Promise.all([
    listDatasetsTool({resource: params?.resource}),
    listEmbeddingsIndicesTool({resource: params?.resource}),
    listReleasesTool({state: 'active', resource: params?.resource}),
  ])

  const todaysDate = new Date().toLocaleDateString('en-US')

  const message = outdent`
    ${MCP_INSTRUCTIONS}

    This is the initial context for your Sanity instance:

    <context>
      ${configInfo}
      ${datasets.content[0].text}
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
