import {z} from 'zod'
import path from 'node:path'
import fs from 'node:fs/promises'
import {withErrorHandling} from '../../utils/response.js'

export const GetGroqSpecificationToolParams = z.object({})

type Params = z.infer<typeof GetGroqSpecificationToolParams>

async function tool(_params?: Params) {
  const mdPath = path.join(__dirname, 'groq-specification.md')
  const specification = await fs.readFile(mdPath, 'utf-8')

  return {
    content: [
      {
        type: 'text' as const,
        text: specification,
      },
    ],
  }
}

export const getGroqSpecificationTool = withErrorHandling(
  tool,
  'Error retrieving GROQ specification',
)
