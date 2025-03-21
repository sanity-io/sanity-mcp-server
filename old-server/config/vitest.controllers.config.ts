import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/controllers/**/*.test.{ts,js}'],
    exclude: [
      'test/integration/**/*.test.{ts,js}',
      'test/unit/**/*.test.{ts,js}',
      'test/utils/**/*.test.{ts,js}'
    ],
    globals: true,
    setupFiles: ['test/setup.ts'],
    testTimeout: 8000, // Shorter timeout for controller tests

    // Don't need isolation for controller tests
    pool: 'threads',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/node_modules/**'],
    }
  }
})
