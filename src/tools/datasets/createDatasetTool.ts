import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {createToolClient, ToolCallExtra} from '../../utils/tools.js'

export const CreateDatasetToolParams = z.object({
  resource: z.object({
    projectId: z.string().describe('The ID of the project to create the dataset in'),
  }),
  datasetName: z
    .string()
    .describe('The name of the dataset (will be automatically formatted to match requirements)'),
  aclMode: z.enum(['private', 'public']).optional().describe('The ACL mode for the dataset'),
})

type Params = z.infer<typeof CreateDatasetToolParams>

async function _tool(args: Params, extra?: ToolCallExtra) {
  const client = createToolClient(
    {
      resource: {
        projectId: args.resource.projectId,
        dataset: 'dummy', // not needed for this API call, but required by client
      },
    },
    extra?.authInfo?.token,
  )

  // Only lowercase letters and numbers are allowed
  const datasetName = args.datasetName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const newDataset = await client.datasets.create(datasetName, {
    aclMode: args.aclMode,
  })

  return createSuccessResponse('Dataset created successfully', {newDataset})
}

export const createDatasetTool = withErrorHandling(_tool, 'Error creating dataset')
