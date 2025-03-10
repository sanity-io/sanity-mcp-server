# TODO

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
         - [ ] Ensure complexity metrics are being properly aggregated in the quality history
         - [ ] Add function-by-function complexity tracking over time
         - [ ] Write tests that verify complexity metrics are correctly captured

    4. [ ] **Fix Coverage Reporting**
         - [ ] Debug coverage data collection process
         - [ ] Ensure coverage reports are being generated and parsed correctly
         - [ ] Add file-level and overall coverage metrics to the dashboard
         - [ ] Add tests to verify coverage data is correctly processed

    5. [✅] **Dashboard Improvements**
         - [✅] Fix chart generation to include all metrics consistently
         - [✅] Improve dashboard with drill-down capabilities for detailed analysis
         - [✅] Add quality score trending with visual indicators
         - [✅] Create tests for dashboard generation that verify all metrics are included
         - [✅] Ensure integration tests are properly represented in the dashboard

    6. [ ] **Refactor High-Complexity Functions**
         - [ ] Analyze and refactor searchContent() in groq.ts (complexity: 25)
         - [ ] Analyze and refactor the high-complexity function in documentHelpers.ts (complexity: 25)
         - [ ] Analyze and refactor the high-complexity function in schema.ts (complexity: 23)
         - [ ] Analyze and refactor query() in groq.ts (complexity: 20)
         - [ ] Add tests for each refactored function to ensure behavior is preserved

    7. [✅] **Performance Optimization**
         - [✅] Reduce dashboard generation time (currently ~40s)
         - [✅] Add a fast mode to skip integration tests during local development
         - [✅] Parallelize test execution where possible
         - [✅] Implement caching for expensive operations
         - [✅] Add command-line flags to selectively run specific metrics
         - [✅] Create a lightweight dashboard mode for quick feedback during development

## Medium Priority

