/**
 * Direct integration tests for schema controller
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import config from '../../src/config/config.js';
import * as schemaController from '../../src/controllers/schema.js';

// Suppress console.error during tests
const originalConsoleError = console.error;
console.error = vi.fn();

// Load the schema fixture for assertions
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixtureSchemaPath = path.join(__dirname, '../fixtures/schema.json');
const schemaData = JSON.parse(fs.readFileSync(fixtureSchemaPath, 'utf-8'));

// Setup a test schema file from our fixture - more direct approach
const targetDir = path.join(__dirname, '../../schemas');
const testSchemaPath = path.join(targetDir, 'mock-project_mock-dataset.json');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to setup/teardown test schema file
function setupTestFile(): void {
  fs.writeFileSync(testSchemaPath, JSON.stringify(schemaData, null, 2));
}

function cleanupTestFile(): void {
  if (fs.existsSync(testSchemaPath)) {
    fs.unlinkSync(testSchemaPath);
  }
}

// Patching config getSchemaPath to return our test path
const originalGetSchemaPath = config.getSchemaPath;
config.getSchemaPath = function(projectId: string, dataset: string): string {
  if (projectId === 'mock-project' && dataset === 'mock-dataset') {
    return testSchemaPath;
  }
  return originalGetSchemaPath.call(this, projectId, dataset);
};

describe('Schema Controller', () => {
  // Setup and teardown for each test
  beforeEach(() => {
    setupTestFile();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    cleanupTestFile();
  });
  
  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  describe('listSchemaTypes', () => {
    it('should return only document types by default', async () => {
      const result = await schemaController.listSchemaTypes('mock-project', 'mock-dataset');
      
      // Verify only document types are returned
      const documentTypes = schemaData
        .filter(item => item.type === 'document')
        .map(item => ({
          name: item.name,
          type: item.type
        }));
      
      expect(result).toEqual(documentTypes);
      
      // Verify no error messages were logged
      expect(console.error).not.toHaveBeenCalled();
    });
    
    it('should return all types when allTypes option is true', async () => {
      const result = await schemaController.listSchemaTypes('mock-project', 'mock-dataset', { allTypes: true });
      
      // Verify all types are returned
      const allTypes = schemaData.map(item => ({
        name: item.name,
        type: item.type
      }));
      
      expect(result).toEqual(allTypes);
      
      // Verify no error messages were logged
      expect(console.error).not.toHaveBeenCalled();
    });
    
    it('should throw an error if schema file is not found', async () => {
      await expect(
        schemaController.listSchemaTypes('nonexistent', 'mock-dataset')
      ).rejects.toThrow(/Schema file not found/);
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getTypeSchema', () => {
    it('should return the schema for a document type', async () => {
      const result = await schemaController.getTypeSchema('mock-project', 'mock-dataset', 'author');
      
      // Verify the result matches our fixture
      const expectedSchema = schemaData.find(item => item.name === 'author');
      expect(result).toEqual(expectedSchema);
      
      // Verify no error messages were logged
      expect(console.error).not.toHaveBeenCalled();
    });
    
    it('should return the schema for a custom type', async () => {
      const result = await schemaController.getTypeSchema('mock-project', 'mock-dataset', 'category');
      
      // Verify the result matches our fixture
      const expectedSchema = schemaData.find(item => item.name === 'category');
      expect(result).toEqual(expectedSchema);
      
      // Verify no error messages were logged
      expect(console.error).not.toHaveBeenCalled();
    });
    
    it('should throw an error if type is not found', async () => {
      await expect(
        schemaController.getTypeSchema('mock-project', 'mock-dataset', 'nonexistent')
      ).rejects.toThrow(/Type 'nonexistent' not found/);
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
});
