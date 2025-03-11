import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.{ts,js}'],
    globals: true,
    setupFiles: ['test/setup.ts'],
    testTimeout: 10000, // 10 seconds timeout for tests
    
    // Use threads for better performance on multi-core machines
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 16, // Adjust based on your CPU cores
      }
    },
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/node_modules/**'],
    },
    
    // Set up workspaces to optimize different test types
    workspace: [
      {
        // Unit tests run without isolation for speed
        extends: true, // Inherit from root config
        test: {
          name: 'unit-tests',
          include: ['test/unit/**/*.test.{ts,js}', 'test/utils/**/*.test.{ts,js}'],
          exclude: [],
          isolate: false, // Run without isolation for speed
          testTimeout: 5000, // Shorter timeout for unit tests
        }
      },
      {
        // Controller tests
        extends: true,
        test: {
          name: 'controller-tests',
          include: ['test/controllers/**/*.test.{ts,js}'],
          exclude: [],
          isolate: false,
          testTimeout: 8000,
        }
      },
      {
        // Critical integration tests need isolation
        extends: true, 
        test: {
          name: 'critical-integration-tests',
          include: ['test/integration/critical/**/*.test.{ts,js}'],
          exclude: [],
          pool: 'forks', // Use forks for integration tests that need process isolation
          isolate: true,
          testTimeout: 15000, // Longer timeout for integration tests
        }
      },
      {
        // Standard integration tests
        extends: true, 
        test: {
          name: 'standard-integration-tests',
          include: ['test/integration/standard/**/*.test.{ts,js}'],
          exclude: [],
          pool: 'forks',
          isolate: true,
          testTimeout: 15000,
        }
      },
      {
        // Extended integration tests
        extends: true, 
        test: {
          name: 'extended-integration-tests',
          include: ['test/integration/extended/**/*.test.{ts,js}'],
          exclude: [],
          pool: 'forks',
          isolate: true,
          testTimeout: 30000, // Longest timeout for extended tests
        }
      }
    ]
  }
});
