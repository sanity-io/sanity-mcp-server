/* eslint-disable */
import {describe, it, expect, afterEach} from 'vitest'
import {spawn, type ChildProcess} from 'child_process'

describe('Dynamic Schema Tests', () => {
  let childProcess: ChildProcess | null = null

  afterEach(() => {
    if (childProcess) {
      childProcess.kill()
      childProcess = null
    }
  })

  async function testServerSchema(env: Record<string, string>) {
    return new Promise<any>((resolve, reject) => {
      childProcess = spawn('npx', ['tsx', 'src/index.ts'], {
        env: {...process.env, ...env},
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      childProcess.stderr?.on('data', (data) => {
        console.error('stderr:', data.toString())
      })

      // Send tools/list request
      const request =
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        }) + '\n'

      childProcess.stdin?.write(request)
      childProcess.stdin?.end()

      setTimeout(() => {
        try {
          const response = JSON.parse(stdout.trim())
          resolve(response)
        } catch (e) {
          reject(new Error(`Failed to parse response: ${stdout}`))
        }
      }, 1000)
    })
  }

  it('tools require full resource when no ENV project/dataset set', async () => {
    const response = await testServerSchema({
      SANITY_API_TOKEN: 'sk_test_bogus_token_12345',
    })

    const queryTool = response.result?.tools?.find((t: any) => t.name === 'query_documents')

    expect(queryTool).toBeDefined()
    expect(queryTool?.inputSchema.properties.resource).toBeDefined()
    expect(queryTool?.inputSchema.properties.resource.properties).toHaveProperty('projectId')
    expect(queryTool?.inputSchema.properties.resource.properties).toHaveProperty('dataset')
  })

  it('tools require only dataset when ENV project set', async () => {
    const response = await testServerSchema({
      SANITY_API_TOKEN: 'sk_test_bogus_token_12345',
      SANITY_PROJECT_ID: 'test-project-id',
    })

    const queryTool = response.result?.tools?.find((t: any) => t.name === 'query_documents')

    expect(queryTool).toBeDefined()
    expect(queryTool?.inputSchema.properties.resource).toBeDefined()
    expect(queryTool?.inputSchema.properties.resource.properties).not.toHaveProperty('projectId')
    expect(queryTool?.inputSchema.properties.resource.properties).toHaveProperty('dataset')
  })

  it('tools require only project id when ENV dataset set', async () => {
    const response = await testServerSchema({
      SANITY_API_TOKEN: 'sk_test_bogus_token_12345',
      SANITY_DATASET: 'test-dataset',
    })

    const queryTool = response.result?.tools?.find((t: any) => t.name === 'query_documents')

    expect(queryTool).toBeDefined()
    expect(queryTool?.inputSchema.properties.resource).toBeDefined()
    expect(queryTool?.inputSchema.properties.resource.properties).not.toHaveProperty('dataset')
    expect(queryTool?.inputSchema.properties.resource.properties).toHaveProperty('projectId')
  })

  it('tools require no resource when both ENV project/dataset set', async () => {
    const response = await testServerSchema({
      SANITY_API_TOKEN: 'sk_test_bogus_token_12345',
      SANITY_PROJECT_ID: 'test-project-id',
      SANITY_DATASET: 'test-dataset',
    })

    const queryTool = response.result?.tools?.find((t: any) => t.name === 'query_documents')

    expect(queryTool).toBeDefined()
    expect(queryTool?.inputSchema.properties).not.toHaveProperty('resource')
  })
})
