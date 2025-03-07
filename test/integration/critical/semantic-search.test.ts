/**
 * Integration test for semantic search tools
 * @vitest-environment node
 * @tags integration, critical
 */
import { describe, it, expect } from 'vitest';
import { EmbeddingsToolProvider } from '../../../src/tools/embeddingsTools.js';

describe('Search Tools Integration', () => {
  it('should have semanticSearch tool registered with correct parameters', () => {
    // Get tools from the embeddings tool provider
    const embeddingsTools = new EmbeddingsToolProvider().getToolDefinitions();
    const searchTool = embeddingsTools.find(tool => tool.name === 'semanticSearch');
    
    expect(searchTool).toBeDefined();
    expect(searchTool.description).toContain('semantic search');
    
    // Check parameter schema
    const paramsSchema = searchTool.parameters.shape;
    expect(paramsSchema.query).toBeDefined();
    expect(paramsSchema.indexName).toBeDefined(); // Verify new required parameter
    expect(paramsSchema.maxResults).toBeDefined();
    expect(paramsSchema.types).toBeDefined();
    expect(paramsSchema.projectId).toBeDefined();
    expect(paramsSchema.dataset).toBeDefined();
  });
  
  it('should have listEmbeddingsIndices tool registered with correct parameters', () => {
    // Get tools from the embeddings tool provider
    const embeddingsTools = new EmbeddingsToolProvider().getToolDefinitions();
    const indicesListTool = embeddingsTools.find(tool => tool.name === 'listEmbeddingsIndices');
    
    expect(indicesListTool).toBeDefined();
    expect(indicesListTool.description).toContain('embeddings indices');
    
    // Check parameter schema
    const paramsSchema = indicesListTool.parameters.shape;
    expect(paramsSchema.projectId).toBeDefined();
    expect(paramsSchema.dataset).toBeDefined();
  });
});
