/**
 * Integration test for semantic search tool
 */
import { jest } from '@jest/globals';
import { getToolDefinitions } from '../../src/controllers/tools.js';

describe('Semantic Search Integration', () => {
  it('should have semanticSearch tool registered with correct parameters', () => {
    const tools = getToolDefinitions();
    const searchTool = tools.find(tool => tool.name === 'semanticSearch');
    
    expect(searchTool).toBeDefined();
    expect(searchTool.description).toContain('semantic search');
    
    // Check parameter schema
    const paramsSchema = searchTool.parameters._def.shape();
    expect(paramsSchema.query).toBeDefined();
    expect(paramsSchema.maxResults).toBeDefined();
    expect(paramsSchema.types).toBeDefined();
  });
});
