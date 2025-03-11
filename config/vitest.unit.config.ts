import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'test/unit/**/*.test.ts',
      'test/utils/**/*.test.ts',
      'test/controllers/**/*.test.ts'
    ],
    exclude: [
      'test/integration/**/*.test.ts'
    ],
    globals: true,
    setupFiles: ['test/setup.ts'],
    testTimeout: 10000,
    
    // Use threads for better performance on multi-core machines
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 16,
      }
    },
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/node_modules/**'],
    }
  }
}); 