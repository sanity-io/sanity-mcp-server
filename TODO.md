# TODO

## Critical Priority
1. [🔄] **NEVER USE STALE DATA IN QUALITY METRICS - HARD FAIL ONLY** (In Progress)

    - The quality dashboard must ALWAYS use fresh data, never cached results
    - Current issue: Some metrics are being reported with "estimated: true" and using cached test results
    - Cached metrics defeat the purpose of a quality dashboard and provide misleading information
    - ~~Fallback mechanisms should be removed entirely~~ → HARD FAIL when tests or metrics collection fails - no exceptions
    - No environment variables or flags to bypass failures - fix the underlying issues instead

    ### Implementation plan
    1. [🔄] **Remove Stale Data Fallbacks**
         - [✅] Identify all locations where stale data is being used as fallback
         - [🔄] HARD FAIL with exceptions when tests or data collection fails - no bypass mechanisms
         - [🔄] Remove ALL fallback mechanisms and environment variable workarounds
         - [✅] Enforce timestamp validation to prevent old data from being used unknowingly
         - [✅] If tests fail, the dashboard generation must fail - never display misleading metrics
         
    2. [ ] **Fix Core Data Collection Issues**
         - [ ] Fix TypeScript errors in test files that cause collection to fail
         - [ ] Debug and fix the test coverage collection process
         - [ ] Make coverage generation robust and reliable
         - [ ] Ensure all tests pass before generating quality metrics
         - [ ] Create a CI check that fails if any metrics collection fails

## High Priority
1. [ ] **Fix and Enhance Quality Dashboard**

    - Dashboard is missing unit tests, complexity metrics, and coverage data
    - Need to generate all time series and values to properly debug the system
    - Key issues include function complexity in several files (groq.ts, documentHelpers.ts, schema.ts)

    ### Implementation plan
    1. [✅] **Diagnostic Tools**
         - [✅] Create a diagnostic script that dumps all raw metrics data to JSON for inspection
         - [✅] Add verbose logging to quality scripts that shows what data is being collected and processed
         - [✅] Implement validation checks that verify all expected metrics are present
         - [✅] Write tests for each diagnostic tool to ensure they correctly identify missing data

    2. [✅] **Fix Missing Unit Test Metrics**
         - [✅] Debug test-results.json generation in collect-test-results.js
         - [✅] Ensure unit test coverage is being properly captured from Vitest
         - [✅] Add explicit tracking of test file coverage percentage
         - [✅] Write tests that verify test result collection and formatting

    3. [🔄] **Fix Missing Complexity Metrics** (In Progress)
         - [✅] Update complexity reporting to correctly identify function names (fix "unknown" function names)
         - [✅] Ensure cyclometric average complexity is properly displayed in time series
         - [✅] Fix cyclomatic max complexity not showing in the dashboard
         - [🔄] Add cognitive complexity metrics to the dashboard alongside cyclomatic complexity
         - [✅] Fix complex function distribution to show medium and low severity functions for all dates (currently only showing high for recent dates)
         - [ ] Add function-by-function complexity tracking over time
         - [ ] Add historical pass / fail with absolute number of tests passing and failing - should be the first chart under metrics charts. Make it full width and not super tall :)
         - [ ] Add back a ESLint error callout button at the top next to ESLint Warning
         - [✅] Write tests that verify complexity metrics are correctly captured

    4. [🔄] **Fix Coverage Reporting** (In Progress)
         - [✅] Fix test coverage trend not showing in the dashboard
         - [ ] Debug coverage data collection process
         - [✅] Fix unit test file count in dashboard (showing 62 when there are only 6 files)
         - [✅] Fix controller test file count in dashboard (showing 66 when there are only 6 files)
         - [ ] Ensure coverage reports are being generated and parsed correctly
         - [ ] Add file-level and overall coverage metrics to the dashboard
         - [ ] Add tests to verify coverage data is correctly processed
         - [ ] Remove the historical data from the 3/8 - we've generated lots of garbage while testing this :)

    5. [🔄] **Dashboard Improvements** (In Progress)
         - [✅] Fix chart generation to include all metrics consistently
         - [✅] Improve dashboard with drill-down capabilities for detailed analysis
         - [✅] Add quality score trending with visual indicators
         - [✅] Create tests for dashboard generation that verify all metrics are included
         - [✅] Ensure integration tests are properly represented in the dashboard
         - [✅] Fix time series data storage and parsing for complexity metrics and test coverage trends
         - [✅] Address data gaps in the timeline charts for complexity and test coverage
         - [✅] Investigate potential double counting of test files (dashboard shows 62 unit test files and 66 controller test files when there are only 6 files in each directory)
         - [✅] Fix file count anomalies for Unit Tests and Standard Integration Tests

    6. [🔄] **Regression Prevention** (In Progress)
         - [✅] Add automated tests for complexity metrics calculation
         - [✅] Add tests for test file count calculation
         - [ ] Add tests for test coverage calculation
         - [ ] Create end-to-end test for dashboard generation
         - [ ] Set up GitHub actions workflow to run metrics tests on PRs

    7. [ ] **Refactor High-Complexity Functions**
         - [ ] Analyze and refactor searchContent() in groq.ts (complexity: 25)
         - [ ] Analyze and refactor the high-complexity function in documentHelpers.ts (complexity: 25)
         - [ ] Analyze and refactor the high-complexity function in schema.ts (complexity: 23)
         - [ ] Analyze and refactor query() in groq.ts (complexity: 20)
         - [ ] Add tests for each refactored function to ensure behavior is preserved

    8. [✅] **Performance Optimization**
         - [✅] Reduce dashboard generation time (currently ~40s)
         - [✅] Add a fast mode to skip integration tests during local development
         - [✅] Parallelize test execution where possible
         - [✅] Implement caching for expensive operations
         - [✅] Add command-line flags to selectively run specific metrics
         - [✅] Create a lightweight dashboard mode for quick feedback during development

## Medium Priority

