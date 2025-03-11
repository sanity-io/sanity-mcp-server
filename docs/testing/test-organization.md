# Test Organization Guide

This guide outlines the standards and best practices for organizing tests in the Sanity MCP Server project. Following these guidelines will ensure consistency, maintainability, and discoverability of tests.

## Directory Structure

The test directory is organized to mirror the structure of the source code. This makes it easier to find tests for a specific component or functionality.

```
/test
  /unit                 # Unit tests for individual components
    /controllers        # Tests for controllers
    /utils              # Tests for utility functions
    /tools              # Tests for tools
    /types              # Tests for type definitions
  /controllers          # Controller-specific tests that may require more integration
  /integration          # Integration tests
    /critical           # Critical integration tests (run in pre-commit)
    /standard           # Standard integration tests (run before merging)
    /extended           # Extended integration tests (run before releases)
  /utils                # Legacy location for utility tests (prefer /unit/utils for new tests)
  /fixtures             # Shared test fixtures
  setup.ts              # Test setup file
  README.md             # Test documentation
```

## Naming Conventions

### Test Files

Test files should follow these naming conventions:

1. Use the same name as the file being tested, appended with `.test.ts`
2. For example, if testing `src/controllers/schema.ts`, the test file should be named `schema.test.ts`

### Test Suites and Cases

1. Use descriptive names for test suites and cases
2. Test suite names should match the component or function being tested
3. Test case names should describe the expected behavior

Example:
```typescript
describe('Schema Controller', () => {
  describe('getSchema', () => {
    it('should return schema from file if it exists', () => {
      // Test implementation
    });
    
    it('should throw an error if schema file does not exist', () => {
      // Test implementation
    });
  });
});
```

## Test File Organization

### Structure

Each test file should follow this structure:

1. Imports
2. Mocks
3. Test fixtures/data setup
4. Test suites and cases

Example:
```typescript
// 1. Imports
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as moduleUnderTest from '../path/to/module';

// 2. Mocks
vi.mock('../path/to/dependency', () => ({
  dependencyFunction: vi.fn()
}));

// 3. Test fixtures/data setup
const testData = {
  // Test data
};

// 4. Test suites and cases
describe('Module Name', () => {
  beforeEach(() => {
    // Setup for each test
  });
  
  describe('functionName', () => {
    it('should do something', () => {
      // Test implementation
    });
  });
});
```

### Import Paths

When importing the module under test or dependencies:

1. Use relative paths
2. Include the file extension (e.g., `.js`, `.ts`)
3. Use consistent import styles across test files

## Test File Location Guidelines

1. **Unit Tests**: Place in `/test/unit/[module-type]/` where `[module-type]` matches the source directory structure.
2. **Controller Tests**: Can be placed in either `/test/unit/controllers/` or `/test/controllers/` depending on the nature of the test.
3. **Integration Tests**: Categorize as critical, standard, or extended based on importance and execution time.

## Best Practices

1. **Independent Tests**: Each test should be independent of others
2. **Focused Tests**: Test one thing at a time
3. **Clear Assertions**: Use clear, explicit assertions
4. **Proper Mocking**: Mock external dependencies
5. **Cleanup**: Clean up after tests
6. **Fast Tests**: Optimize for speed, especially for unit tests

## Example of a Well-Organized Test File

Below is an example of a well-organized test file for a controller:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as schemaController from '../../../src/controllers/schema.js';
import config from '../../../src/config/config.js';

vi.mock('fs/promises');
vi.mock('../../../src/config/config.js', () => ({
  default: {
    getSchemaPath: vi.fn(),
  }
}));

describe('Schema Controller', () => {
  // Test data
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
      name: 'category',
      type: 'document',
      fields: [
        { name: 'title', type: 'string' }
      ]
    },
    {
      name: 'customType',
      type: 'custom',
      fields: [
        { name: 'data', type: 'string' }
      ]
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup default mock implementations
    (config.getSchemaPath as any).mockReturnValue('/path/to/schema.js');
  });

  describe('getSchema', () => {
    it('should return schema from file if it exists', async () => {
      // Arrange
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockSchema));
      
      // Act
      const result = await schemaController.getSchema('project123', 'dataset123');
      
      // Assert
      expect(result).toEqual(mockSchema);
      expect(config.getSchemaPath).toHaveBeenCalledWith('project123', 'dataset123');
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/schema.js', 'utf8');
    });

    it('should throw an error if schema file does not exist', async () => {
      // Arrange
      (fs.readFile as any).mockRejectedValue(new Error('ENOENT: file not found'));
      
      // Act & Assert
      await expect(
        schemaController.getSchema('project123', 'dataset123')
      ).rejects.toThrow('Schema file not found');
    });
  });
});
```

## Migrating Existing Tests

When working with existing tests, follow these guidelines:

1. **Don't Move Tests**: Keep existing tests in their current location to avoid breaking changes
2. **New Tests Follow Guidelines**: Ensure all new tests follow these guidelines
3. **Gradual Improvement**: Improve existing tests gradually when making changes to related code
4. **Documentation**: Document any deviations from these guidelines when necessary

## Vitest Configuration

Our Vitest configuration is set up to properly discover tests in all locations. The main configuration files are:

- `config/vitest.unit.config.ts` - For unit tests
- `config/vitest.controllers.config.ts` - For controller tests
- `config/vitest.integration.critical.config.ts` - For critical integration tests
- `config/vitest.integration.standard.config.ts` - For standard integration tests
- `config/vitest.integration.extended.config.ts` - For extended integration tests

See these files for specific configuration details. 