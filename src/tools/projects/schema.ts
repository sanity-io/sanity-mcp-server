import {z} from 'zod'

export const GetProjectParams = {
  projectId: z.string().describe('Project id for the sanity project'),
}

export const GetProjectParamsSchema = z.object(GetProjectParams)

export type GetProjectParamsType = z.infer<typeof GetProjectParamsSchema>

export const StudioSchema = z.object({
  type: z.enum(['sanity-hosted', 'external']),
  url: z.string().url(),
})

export type Studio = z.infer<typeof StudioSchema>
