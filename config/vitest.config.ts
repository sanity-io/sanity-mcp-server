import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
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
          include: ['test/unit/**/*.test.ts'],
          isolate: false, // Run without isolation for speed
        }
      },
      {
        // Integration tests need isolation
        extends: true, 
        test: {
          name: 'integration-tests',
          include: ['test/integration/**/*.test.ts'],
          pool: 'forks', // Use forks for integration tests that need process isolation
          isolate: true,
        }
      }
    ]
  },
});
