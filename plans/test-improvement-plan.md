# Test Improvement Plan

## Background
The current codebase has several testing issues that need to be addressed:
1. TypeScript errors in test files
2. ESLint configuration problems, particularly with the sonarjs/cognitive-complexity rule
3. Unit tests not properly running or being discovered
4. Integration tests with potential failures
5. Vitest configuration not optimally set up for different test types
6. Lack of comprehensive test documentation

This plan outlines the steps to improve the test suite and ensure all tests are passing successfully.

## Phase 1: Fix TypeScript Configuration and Errors

### Issues Identified
- Module import errors in quality-validation.test.ts and complexity-check.test.js
- TypeScript configuration may need adjustments for test files
- tsconfig.test.json may not be including all test files properly

### Action Plan
1. Fix the import statements in test/unit/quality-validation.test.ts
   - Modify the import path for validateAllMetrics to find the correct module
   - Ensure the scripts/quality directory exists and contains the required files

2. Fix the import statements in test/unit/quality/complexity-check.test.js
   - Update the import path for complexity-check.js
   - Consider converting the test to TypeScript if appropriate

3. Run typecheck:all and address all remaining TypeScript errors
   - Fix type-related errors in test files
   - Update TypeScript configuration if needed

4. Ensure consistent TypeScript configuration across all test suites
   - Review tsconfig.test.json to ensure it's properly configured
   - Make sure all test files are included in the TypeScript configuration
   - Update include/exclude patterns to properly target test files

## Phase 2: Resolve ESLint Issues

### Issues Identified
- sonarjs/cognitive-complexity rule not found in ESLint configuration
- Dependency issues with eslint-plugin-sonarjs
- Unused variables and imports throughout the codebase
- Functions with high complexity scores
- ESLint needs better configuration for test files

### Action Plan
1. Fix sonarjs/cognitive-complexity configuration in .eslintrc.json
   - Ensure the sonarjs plugin is properly installed and configured
   - Verify the rule is correctly set up in the ESLint configuration

2. Update eslint-plugin-sonarjs to latest version and ensure proper configuration
   - Update the package to the latest version
   - Configure the plugin properly in .eslintrc.json

3. Address unused variables and imports across the codebase
   - Use the --fix option with ESLint where possible (`npm run lint:fix`)
   - Manually address remaining issues that can't be fixed automatically

4. Refactor functions with high complexity scores
   - Identify functions with complexity above 10
   - Break down complex functions into smaller, more manageable pieces
   - Update tests to reflect refactored code

5. Create ESLint configuration to disable specific rules in test files
   - Set up proper ESLint overrides for test files
   - Disable rules that are too strict for test files but maintain core quality checks

## Phase 3: Improve Vitest Configuration

### Issues Identified
- Workspace configuration doesn't match test directory structure
- Controllers directory tests may need special handling
- Test timeouts may not be optimized for different test types
- Test isolation settings may need adjustments

### Action Plan
1. Update workspace configuration to better match test directory structure
   - Create dedicated workspaces for unit, controller, and integration tests
   - Ensure proper test discovery patterns for each workspace

2. Add controllers workspace to Vitest configuration
   - Set up a specific workspace for controller tests
   - Configure appropriate settings for controller tests

3. Optimize test timeouts for different test types
   - Set longer timeouts for integration tests
   - Set shorter timeouts for unit tests

4. Configure proper test isolation settings for each test type
   - Use isolation for integration tests that need it
   - Skip isolation for unit tests for better performance

## Phase 4: Unit Test Improvements

### Issues Identified
- Test files not being discovered correctly
- Potential test failures in existing unit tests
- Missing test coverage for some controllers and utilities
- Improper mocking of external dependencies

### Action Plan
1. Fix test directory structure and ensure tests are discovered
   - Verify the test pattern in Vitest configuration
   - Make sure test files follow the naming convention
   - Address any path issues that prevent tests from being found

2. Fix existing unit test failures
   - Run individual test files to identify specific failures
   - Fix assertion errors and update test expectations
   - Address any broken imports or references

3. Add test coverage for controllers without sufficient tests
   - Identify controllers with low coverage
   - Add new tests for critical functionality
   - Ensure all core controller methods are tested

4. Implement tests for core utility functions
   - Ensure all utility functions have proper test coverage
   - Add edge case testing for critical utilities
   - Test error handling in utility functions

5. Set up proper mocking for external dependencies
   - Create consistent mocking patterns for Sanity client
   - Set up proper stubs for external API calls
   - Document mocking patterns for future tests

## Phase 5: Integration Test Enhancements

### Issues Identified
- Potential failures in integration tests
- Missing tests for some workflows
- Slow-running integration tests
- Inefficient setup and teardown processes

### Action Plan
1. Fix critical integration test failures
   - Run critical tests and identify failures
   - Address issues with test setup or assertions
   - Fix any environmental dependencies

2. Ensure core document operations tests are passing
   - Run test:core and fix any failures
   - Improve reliability of document operation tests
   - Add better error handling and diagnostic information

3. Add integration tests for missing workflows
   - Identify gaps in test coverage for workflows
   - Add new tests to cover these workflows
   - Ensure all critical paths are tested

4. Optimize slow-running integration tests
   - Identify bottlenecks in integration tests
   - Improve test setup and teardown to reduce execution time
   - Consider parallelization where appropriate
   - Implement more efficient resource cleanup

## Phase 6: Testing Documentation

### Issues Identified
- Lack of clear documentation for test categories
- Missing guidelines for writing effective tests
- Unclear test environment requirements
- No established criteria for test quality

### Action Plan
1. Document test categories and their intended use cases
   - Create documentation for unit, controller, and integration tests
   - Clarify when to use each test category
   - Document the test directory structure and organization

2. Create guide for writing effective tests
   - Document best practices for test structure
   - Provide examples of good test patterns
   - Include guidelines for mocking and test isolation

3. Document test environment setup requirements
   - Clarify environment variables needed for tests
   - Document external dependencies required for testing
   - Provide setup scripts or instructions for local testing

4. Establish clear criteria for test quality
   - Define coverage targets for different code areas
   - Set guidelines for test assertions and edge cases
   - Create checklist for reviewing test quality

## Phase 7: Pre-commit and CI Improvements

### Issues Identified
- Husky configuration is deprecated and needs updating
- Pre-commit hooks could be more efficient
- Code quality checks not integrated into pre-commit process
- Copy-paste detection not implemented

### Action Plan
1. Update husky to latest version and fix deprecated configuration
   - Update the husky package to the latest version
   - Fix the deprecated configuration in `.husky/pre-commit`
   - Ensure proper hook execution

2. Implement smarter test selection in pre-commit hook
   - Only run tests for changed files when possible
   - Skip tests when only documentation is changed
   - Add selective linting based on changed files

3. Add cyclomatic and cognitive complexity checks as pre-commit hooks (Low Priority)
   - Integrate complexity checks into the pre-commit process
   - Set thresholds for acceptable complexity
   - Document how to interpret and address complexity issues

4. Implement copy-paste detection in CI pipeline
   - Set up jscpd for detecting code duplication
   - Configure thresholds for acceptable duplication
   - Generate reports to help eliminate duplicated code

## Timeline and Milestones

### Milestone 1: Fix Configuration Issues (Days 1-2)
- Fix TypeScript errors in test files
- Resolve ESLint configuration problems
- Update Vitest configuration
- Ensure tests are properly discovered

### Milestone 2: Fix Existing Tests (Days 3-5)
- Fix unit test failures
- Fix critical integration test failures
- Ensure core document operations tests pass

### Milestone 3: Improve Test Coverage (Days 6-10)
- Add missing unit tests
- Add missing integration tests
- Optimize test performance

### Milestone 4: Documentation and CI (Days 11-14)
- Create testing documentation
- Update pre-commit hooks
- Implement advanced code quality checks 