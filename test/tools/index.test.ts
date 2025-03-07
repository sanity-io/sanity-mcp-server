/**
 * Tools Registry Tests
 * 
 * Tests the tools registry functionality and individual tool definitions
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as toolsRegistry from '../../src/tools/index.js';
import { SchemaToolProvider } from '../../src/tools/schemaTools.js';
import { MutateToolProvider } from '../../src/tools/mutateTools.js';
import { EmbeddingsToolProvider } from '../../src/tools/embeddingsTools.js';
import { GroqToolProvider } from '../../src/tools/groqTools.js';

describe('Tools', () => {
  let allTools;
  let schemaTools;
  let mutateTools;
  let embeddingsTools;
  let groqTools;
  let getTypeSchemaTool;
  let mutateDocumentTool;
  let mutateTextFieldTool;
  let executeGroqTool;
  let semanticSearchTool;

  beforeAll(() => {
    // Get all tools
    allTools = toolsRegistry.getToolDefinitions();
    
    // Get individual provider's tools
    schemaTools = new SchemaToolProvider().getToolDefinitions();
    mutateTools = new MutateToolProvider().getToolDefinitions();
    embeddingsTools = new EmbeddingsToolProvider().getToolDefinitions();
    groqTools = new GroqToolProvider().getToolDefinitions();
    
    // Find specific tools
    getTypeSchemaTool = schemaTools.find(tool => tool.name === 'getTypeSchema');
    mutateDocumentTool = mutateTools.find(tool => tool.name === 'mutateDocument');
    mutateTextFieldTool = mutateTools.find(tool => tool.name === 'mutateTextField');
    executeGroqTool = groqTools.find(tool => tool.name === 'executeGroq');
    semanticSearchTool = embeddingsTools.find(tool => tool.name === 'semanticSearch');
  });

  describe('getToolDefinitions', () => {
    it('should return an array of tool definitions', () => {
      expect(Array.isArray(allTools)).toBe(true);
      expect(allTools.length).toBeGreaterThan(0);
    });

    it('should include schema tools', () => {
      const hasSchemaTools = allTools.some(tool => 
        tool.name === 'getSchema' || 
        tool.name === 'getTypeSchema' || 
        tool.name === 'listSchemaTypes'
      );
      expect(hasSchemaTools).toBe(true);
    });

    it('should include mutate tools', () => {
      // Check if mutate tools are included in the main tool registry
      const hasMutateTools = allTools.some(tool => 
        tool.name === 'mutateDocument' || 
        tool.name === 'mutateTextField'
      );
      expect(hasMutateTools).toBe(true);
      
      // Additionally validate that the mutate tool provider returns these tools
      expect(mutateDocumentTool).toBeDefined();
      expect(mutateTextFieldTool).toBeDefined();
    });

    it('should include GROQ tools', () => {
      // Check if GROQ tools are included in the main tool registry
      const hasGroqTools = allTools.some(tool => 
        tool.name === 'executeGroq'
      );
      expect(hasGroqTools).toBe(true);
      
      // Additionally validate that the GROQ tool provider returns this tool
      expect(executeGroqTool).toBeDefined();
    });

    it('should include semantic search tool', () => {
      // Check if semantic search tools are included in the main tool registry
      const hasSemanticSearch = allTools.some(tool => 
        tool.name === 'semanticSearch'
      );
      expect(hasSemanticSearch).toBe(true);
      
      // Additionally validate that the embeddings tool provider returns this tool
      expect(semanticSearchTool).toBeDefined();
    });
  });

  describe('getToolDefinition', () => {
    it('should return the correct tool definition by name', () => {
      const tool = toolsRegistry.getToolDefinition('getSchema');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('getSchema');
    });

    it('should return null for unknown tool name', () => {
      const tool = toolsRegistry.getToolDefinition('nonExistentTool');
      expect(tool).toBeNull();
    });
  });

  describe('getTypeSchema', () => {
    it('should exist', () => {
      expect(getTypeSchemaTool).toBeDefined();
    });

    it('should have correct parameters', () => {
      const paramSchema = getTypeSchemaTool.parameters.shape;
      expect(paramSchema.typeName).toBeDefined();
      expect(paramSchema.projectId).toBeDefined();
      expect(paramSchema.dataset).toBeDefined();
    });
  });

  describe('mutateDocument', () => {
    it('should exist', () => {
      expect(mutateDocumentTool).toBeDefined();
    });

    it('should have correct parameters', () => {
      const paramSchema = mutateDocumentTool.parameters.shape;
      expect(paramSchema.mutations).toBeDefined();
      expect(paramSchema.projectId).toBeDefined();
      expect(paramSchema.dataset).toBeDefined();
      expect(paramSchema.returnDocuments).toBeDefined();
    });
  });

  describe('executeGroq', () => {
    it('should exist', () => {
      expect(executeGroqTool).toBeDefined();
    });

    it('should have correct parameters', () => {
      const paramSchema = executeGroqTool.parameters.shape;
      expect(paramSchema.query).toBeDefined();
      expect(paramSchema.projectId).toBeDefined();
      expect(paramSchema.dataset).toBeDefined();
      expect(paramSchema.params).toBeDefined();
    });
  });

  describe('semanticSearch', () => {
    it('should exist', () => {
      expect(semanticSearchTool).toBeDefined();
    });

    it('should have correct parameters', () => {
      const paramSchema = semanticSearchTool.parameters.shape;
      expect(paramSchema.query).toBeDefined();
      expect(paramSchema.indexName).toBeDefined();
      expect(paramSchema.projectId).toBeDefined();
      expect(paramSchema.dataset).toBeDefined();
      expect(paramSchema.maxResults).toBeDefined();
      expect(paramSchema.types).toBeDefined();
    });
  });
});
