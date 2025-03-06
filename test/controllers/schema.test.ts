import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as schemaController from '../../src/controllers/schema.js';
import config from '../../src/config/config.js';

vi.mock('fs/promises');
vi.mock('../../src/config/config.js', () => ({
  default: {
    getSchemaPath: vi.fn(),
  }
}));

describe('Schema Controller', () => {
  // Define mock schema for testing
  const mockSchema = [
    {
      name: 'author',
      type: 'document',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'bio', type: 'text' }
      ]
    },
    {
      name: 'post',
      type: 'document',
      fields: [
        { name: 'title', type: 'string' },
        { 
          name: 'author', 
          type: 'reference', 
          to: { type: 'author' } 
        },
        {
          name: 'categories',
          type: 'array',
          of: [{ type: 'reference', to: { type: 'category' } }]
        },
        {
          name: 'content',
          type: 'array',
          of: [{ type: 'block' }]
        }
      ]
    },
    {
      name: 'category',
      type: 'type',
      fields: [
        { name: 'title', type: 'string' }
      ]
    },
    {
      name: 'block',
      type: 'type',
      fields: [
        { name: 'text', type: 'string' }
      ]
    }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(config.getSchemaPath).mockReturnValue('/mock/path/to/schema.json');
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSchema));
  });

  describe('getSchema', () => {
    it('should return schema from file if it exists', async () => {
      const result = await schemaController.getSchema('mock-project', 'mock-dataset');
      
      expect(result).toEqual(mockSchema);
      expect(config.getSchemaPath).toHaveBeenCalledWith('mock-project', 'mock-dataset');
      expect(fs.readFile).toHaveBeenCalledWith('/mock/path/to/schema.json', 'utf-8');
    });

    it('should throw an error if schema file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      
      vi.mocked(fs.readFile).mockRejectedValueOnce(error);
      
      await expect(schemaController.getSchema('mock-project', 'mock-dataset'))
        .rejects
        .toThrow('Schema file not found for project mock-project and dataset mock-dataset');
    });

    it('should throw on other file read errors', async () => {
      const error = new Error('Some other error');
      vi.mocked(fs.readFile).mockRejectedValueOnce(error);
      
      await expect(schemaController.getSchema('mock-project', 'mock-dataset'))
        .rejects
        .toThrow('Failed to get schema:');
    });
  });

  describe('listSchemaTypes', () => {
    it('should list only document types by default', async () => {
      const result = await schemaController.listSchemaTypes('mock-project', 'mock-dataset');
      
      // Should only include document types
      expect(result).toEqual([
        { name: 'author', type: 'document' },
        { name: 'post', type: 'document' }
      ]);
    });

    it('should list all types when allTypes option is true', async () => {
      const result = await schemaController.listSchemaTypes('mock-project', 'mock-dataset', { allTypes: true });
      
      // Should include all types
      expect(result).toEqual([
        { name: 'author', type: 'document' },
        { name: 'post', type: 'document' },
        { name: 'category', type: 'type' },
        { name: 'block', type: 'type' }
      ]);
    });

    it('should catch and rethrow errors', async () => {
      const error = new Error('Schema error');
      vi.mocked(fs.readFile).mockRejectedValueOnce(error);
      
      await expect(schemaController.listSchemaTypes('mock-project', 'mock-dataset'))
        .rejects
        .toThrow('Failed to list schema types:');
        
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getTypeSchema', () => {
    it('should return the schema for a document type', async () => {
      const result = await schemaController.getTypeSchema('mock-project', 'mock-dataset', 'author');
      
      expect(result.name).toBe('author');
      expect(result.type).toBe('document');
    });

    it('should return the schema for a custom type', async () => {
      const result = await schemaController.getTypeSchema('mock-project', 'mock-dataset', 'category');
      
      expect(result.name).toBe('category');
      expect(result.type).toBe('type');
    });

    it('should throw an error if type is not found', async () => {
      await expect(schemaController.getTypeSchema('mock-project', 'mock-dataset', 'nonexistent'))
        .rejects
        .toThrow("Type 'nonexistent' not found in schema");
    });
  });

  describe('getSchemaForType', () => {
    it('should get document schema for a type', async () => {
      const result = await schemaController.getSchemaForType('mock-project', 'mock-dataset', 'author');
      
      expect(result.name).toBe('author');
      expect(result.type).toBe('document');
    });

    it('should get non-document schema for a type', async () => {
      const result = await schemaController.getSchemaForType('mock-project', 'mock-dataset', 'category');
      
      expect(result.name).toBe('category');
      expect(result.type).toBe('type');
    });

    it('should include referenced types when includeReferences is true', async () => {
      const result = await schemaController.getSchemaForType('mock-project', 'mock-dataset', 'post', { includeReferences: true });
      
      expect(result.name).toBe('post');
      expect(result.references).toBeDefined();
      expect(result.references.length).toBeGreaterThan(0);
      
      // Check that referenced types are included
      const referenceNames = result.references.map(ref => ref.name);
      expect(referenceNames).toContain('author');
      expect(referenceNames).toContain('category');
    });

    it('should throw error when type is not found', async () => {
      await expect(schemaController.getSchemaForType('mock-project', 'mock-dataset', 'nonexistent'))
        .rejects
        .toThrow('Type nonexistent not found in schema');
    });
  });
});
