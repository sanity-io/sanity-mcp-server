import {z} from 'zod'
import {outdent} from 'outdent'
import {listEmbeddingsIndicesTool} from '../embeddings/listEmbeddingsTool.js'
import {listReleasesTool} from '../releases/listReleases.js'
import {contextStore} from './store.js'
import {withErrorHandling} from '../../utils/response.js'
import {listWorkspaceSchemasTool} from '../schema/listWorkspaceSchemasTool.js'
import {MCP_INSTRUCTIONS} from './instructions.js'
import {type BaseToolSchema, createToolClient} from '../../utils/tools.js'

export const GetInitialContextToolParams = z.object({})

type Params = z.infer<typeof GetInitialContextToolParams>

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext()
}

async function tool(_params: Params) {
  const client = createToolClient()
  const config = client.config()
  const configInfo = `Current Sanity Configuration:
  - Project ID: ${config.projectId}
  - Dataset: ${config.dataset}
  - API Version: ${config.apiVersion}
  - Using CDN: ${config.useCdn}
  - Perspective: ${config.perspective || 'drafts'}`

  if (!config.projectId || !config.dataset) {
    throw new Error('Project ID and Dataset must be set')
  }

  const resource: z.infer<typeof BaseToolSchema.shape.resource> = {
    target: 'dataset',
    projectId: config.projectId,
    dataset: config.dataset,
  }

  const [workspaceSchemas, releases, embeddings] = await Promise.all([
    listWorkspaceSchemasTool({resource}),
    listReleasesTool({state: 'active', resource}),
    listEmbeddingsIndicesTool({resource}),
  ])

  const todaysDate = new Date().toLocaleDateString('en-US')

  const message = outdent`
    ${MCP_INSTRUCTIONS}

    This is the initial context for your Sanity instance:

    <context>
      ${configInfo}

      ${workspaceSchemas.content[0].text}
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
