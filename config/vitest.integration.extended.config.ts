import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/extended/**/*.test.{ts,js}'],
    exclude: [
      'test/integration/critical/**/*.test.{ts,js}',
      'test/integration/standard/**/*.test.{ts,js}',
      'test/unit/**/*.test.{ts,js}',
      'test/controllers/**/*.test.{ts,js}',
      'test/utils/**/*.test.{ts,js}'
    ],
    globals: true,
    setupFiles: ['test/setup.ts'],
    testTimeout: 30000, // Longer timeout for extended tests
    
    // Use forks for integration tests that need process isolation
    pool: 'forks',
    
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