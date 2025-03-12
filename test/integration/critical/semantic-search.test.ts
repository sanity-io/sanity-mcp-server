/**
 * Integration test for semantic search tools
 * @vitest-environment node
 * @tags integration, critical
 */
import {describe, expect, it} from 'vitest'

import {EmbeddingsToolProvider} from '../../../src/tools/embeddingsTools.js'

describe('Search Tools Integration', () => {
  it('should have semanticSearch tool registered with correct parameters', () => {
    // Get tools from the embeddings tool provider
    const embeddingsTools = new EmbeddingsToolProvider().getToolDefinitions()
    const searchTool = embeddingsTools.find((tool) => tool.name === 'semanticSearch')

    expect(searchTool).toBeDefined()
    if (!searchTool) {
      // Early return if tool not found to satisfy TypeScript
      return
    }

    expect(searchTool.description).toContain('semantic search')

    // Check parameter schema
    const paramsSchema = searchTool.parameters.shape
    // Using type assertion for the second pattern of the union type
    const schema = paramsSchema as {
      query: any;
      indexName: any;
      maxResults: any;
      types: any;
      projectId: any;
      dataset: any;
    }

    expect(schema.query).toBeDefined()
    expect(schema.indexName).toBeDefined() // Verify new required parameter
    expect(schema.maxResults).toBeDefined()
    expect(schema.types).toBeDefined()
    expect(schema.projectId).toBeDefined()
    expect(schema.dataset).toBeDefined()
  })

  it('should have listEmbeddingsIndices tool registered with correct parameters', () => {
    // Get tools from the embeddings tool provider
    const embeddingsTools = new EmbeddingsToolProvider().getToolDefinitions()
    const indicesListTool = embeddingsTools.find((tool) => tool.name === 'listEmbeddingsIndices')

    expect(indicesListTool).toBeDefined()
    if (!indicesListTool) {
      // Early return if tool not found to satisfy TypeScript
      return
    }

    expect(indicesListTool.description).toContain('embeddings indices')

    // Check parameter schema
    const paramsSchema = indicesListTool.parameters.shape
    expect(paramsSchema.projectId).toBeDefined()
    expect(paramsSchema.dataset).toBeDefined()
  })
})
