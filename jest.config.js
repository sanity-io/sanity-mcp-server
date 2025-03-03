export default {
  transform: {},
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/test/**/*.test.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  resetMocks: true,
  clearMocks: true,
  testTimeout: 10000,
};
