import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: true,
    setupFiles: ['test/setup.ts'],
    testTimeout: 10000, // 10 seconds timeout for tests
    // Define integration test categories with tags
    tags: {
      // Categories for integration tests
      integration: 'Integration tests',
      critical: 'Critical integration tests - always run pre-commit',
      standard: 'Standard integration tests - run pre-merge',
      extended: 'Extended integration tests - run nightly',
    },
  },
});
