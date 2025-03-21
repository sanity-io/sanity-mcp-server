# Integration Test Categories

The integration tests are organized into three categories based on their execution time and importance:

## Critical Integration Tests

Located in `test/integration/critical/`

These tests are:
- Fast to execute (typically < 1 second each)
- Essential for core functionality verification
- Run as part of pre-commit hooks
- Should be kept minimal and highly focused

Current tests in this category:
- `semantic-search.test.ts` - Verifies the core semantic search functionality

## Standard Integration Tests

Located in `test/integration/standard/`

These tests are:
- Moderate in execution time (typically < 5 seconds each)
- Important for verifying key workflows
- Run before merge or push to the main branch
- Cover the main user workflows

Current tests in this category:
- `array-parameter-deserialization.test.ts` - Tests array parameter handling
- `release-document-workflow.test.ts` - Tests the release and document workflows

## Extended Integration Tests

Located in `test/integration/extended/`

These tests are:
- Potentially slow or resource-intensive
- Comprehensive but not critical for every code change
- Run on nightly builds or before major releases
- May involve extensive data setup/teardown

Current tests in this category:
- `schema-single-types.test.ts` - Comprehensive schema type testing

## Test Commands

The following npm scripts are available for running different test categories:

```bash
# Run all tests
npm run test:all

# Run just unit tests
npm run test:unit

# Run only critical integration tests (fast)
npm run test:integration:critical

# Run only standard integration tests
npm run test:integration:standard

# Run only extended integration tests
npm run test:integration:extended

# Run pre-commit tests (unit + critical integration)
npm run test:pre-commit

# Run pre-merge tests (unit + critical + standard integration)
npm run test:pre-merge
```

## Adding New Tests

When adding new integration tests, consider:

1. How fast is the test?
2. How critical is the functionality being tested?
3. Does it need to run on every commit?

Place your test in the appropriate category folder and add the corresponding tags in the test file header:

```typescript
/**
 * @vitest-environment node
 * @tags integration, [critical|standard|extended]
 */
```
