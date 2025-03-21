# Testing Strategy for Sanity MCP Server

> **Note:** For detailed guidelines on test organization, naming conventions, and best practices, please refer to the [Test Organization Guide](../docs/testing/test-organization.md).

## Test Categories

We've organized our tests into distinct categories to optimize for both speed and coverage.

### Core Tests

**Purpose**: Verify the most fundamental document operations that form the heart of our API.

**What's tested**: Basic document operations (create, read, update, patch, delete)

**Implementation**: 
- Uses `client.getDocument()` to directly fetch documents including drafts 
- Uses `client.transaction()` for reliable document updates and patches
- Handles both draft and published document versions
- Includes comprehensive error handling and logging
- Features proper cleanup to prevent test document accumulation
- Performance optimized:
  - Uses intelligent polling instead of fixed delays
  - Implements predicate-based condition checking
  - Parallelizes operations where possible
  - Reduces polling intervals to minimum required time
  - ~35% faster than previous implementation (6s vs 9s)

**When to run**: 
- ✅ On every commit (via pre-commit hook)
- ✅ During development to verify basic functionality

**Command**: `npm run test:core`

### Unit Tests

**Purpose**: Test individual components in isolation.

**What's tested**: Functions, classes, and utilities without external dependencies.

**When to run**:
- ✅ On every commit (via pre-commit hook)
- ✅ During development when modifying specific components

**Command**: `npm run test:unit`

### Integration Test Categories

We've categorized integration tests to allow targeted test execution based on needs:

#### Critical Integration Tests

**Purpose**: Essential integration tests beyond core document operations.

**What's tested**: Key API functions that are critical to the system but not part of the core test.

**When to run**:
- ⚠️ When modifying code that affects these areas
- ✅ Before merging to main branch

**Command**: `npm run test:integration:critical`

#### Standard Integration Tests

**Purpose**: Important but not critical tests for functionality.

**What's tested**: Important features that can be deferred for validation.

**When to run**:
- ⚠️ When modifying code that affects these areas
- ✅ Before merging to main branch

**Command**: `npm run test:integration:standard`

#### Extended Integration Tests

**Purpose**: Comprehensive tests for edge cases and complex scenarios.

**What's tested**: Complex workflows, edge cases, and more extensive validations.

**When to run**:
- ⚠️ When modifying code that affects these areas
- ✅ Before releases
- ✅ Scheduled builds

**Command**: `npm run test:integration:extended`

## Testing Best Practices

1. **Document testing**: Always use client.getDocument() with proper draft handling when testing document operations
2. **Error handling**: Include comprehensive error handling in tests to make debugging easier
3. **Document cleanup**: Ensure test documents are properly cleaned up after tests
4. **Delay after operations**: Add short delays after document operations to ensure changes are available

## Convenience Scripts

- `test:pre-commit`: Runs unit tests and core tests (fast!)
- `test:pre-merge`: Runs unit tests, core tests, critical and standard integration tests
- `test:all`: Runs all tests including type checking
- `test:integration`: Runs all integration tests

## Guidelines for Test Selection

1. **For rapid development**: Use `npm run test:core` to verify basic functionality
2. **For component changes**: Use `npm run test:unit` plus specific integration tests
3. **Before sharing code**: Use `npm run test:pre-commit` to ensure fundamentals work
4. **Before merging PRs**: Use `npm run test:pre-merge` for more comprehensive validation
5. **Before releases**: Use `npm run test:all` to validate the entire codebase

Remember: Be judicious about which tests you run. The core and unit tests should be enough for most development work.
