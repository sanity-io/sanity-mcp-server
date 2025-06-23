import {outdent} from 'outdent'
import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {type BaseToolSchema, createToolClient} from '../../utils/tools.js'
import {_tool as listEmbeddings} from '../embeddings/listEmbeddingsTool.js'
import {_tool as listReleases} from '../releases/listReleases.js'
import {SCHEMA_DEPLOYMENT_INSTRUCTIONS} from '../schema/common.js'
import {_tool as listWorkspaceSchemas} from '../schema/listWorkspaceSchemasTool.js'
import {MCP_INSTRUCTIONS} from './instructions.js'
import {contextStore} from './store.js'

export const GetInitialContextToolParams = z.object({})

type Params = z.infer<typeof GetInitialContextToolParams>

function getResultValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null
}

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext()
}

async function _tool(_params: Params) {
  const client = createToolClient()
  const config = client.config()
  const configInfo = `Current Sanity Configuration:
  - Resource type: "dataset"
  - Project ID: "${config.projectId}"
  - Dataset: "${config.dataset}"
  - Default perspective: "${config.perspective || 'drafts'}"`

  if (!config.projectId || !config.dataset) {
    throw new Error('Project ID and Dataset must be set')
  }

  const resource: z.infer<typeof BaseToolSchema.shape.resource> = {
    target: 'dataset',
    projectId: config.projectId,
    dataset: config.dataset,
  }

  const results = await Promise.allSettled([
    listWorkspaceSchemas({resource}),
    listReleases({state: 'active', resource}),
    listEmbeddings({resource}),
  ])

  const workspaceSchemas = getResultValue(results[0])
  const releases = getResultValue(results[1])
  const embeddings = getResultValue(results[2])

  if (!workspaceSchemas || workspaceSchemas.content.length === 0) {
    throw new Error(SCHEMA_DEPLOYMENT_INSTRUCTIONS)
  }

  const todaysDate = new Date().toLocaleDateString('en-US')

  const message = outdent`
    ${MCP_INSTRUCTIONS}

    This is the initial context for your Sanity instance:

    <context>
      ${configInfo}

      ${workspaceSchemas.content[0].text}
      ${embeddings?.content?.[0]?.text || 'No embeddings available'}
      ${releases?.content?.[0]?.text || 'No active releases'}
    </content>

    <todaysDate>${todaysDate}</todaysDate>
  `

  contextStore.setInitialContextLoaded()

  return createSuccessResponse(message)
}

export const getInitialContextTool = withErrorHandling(_tool, 'Error getting initial context')
