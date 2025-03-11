# Changelog

All notable changes to the Sanity MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added

### Improved
- Cleaned up codebase by removing placeholder quality scripts:
  - Removed non-functional quality test scripts (complexity-check.js, validate-metrics.js)
  - Removed placeholder tests and mock implementations
  - Removed unused dependencies and references to quality scripts
  - Simplified CI/CD workflow by removing extended integration tests that are now only run locally
  - Maintained ESLint complexity checking, which provides actual functionality
  - Fixed `test:unit` command to properly run unit and controller tests without including integration tests

- Fixed test configuration and ESLint setup:
  - Added detailed comments to ESLint config explaining rule exceptions
  - Made test-specific rules more lenient while maintaining strict rules for source code
  - Fixed unused imports and variables across multiple controllers
  - Optimized Vitest configuration with proper test timeouts
  - Refactored complex functions to improve maintainability
  - Extracted helper functions from embeddings controller to reduce complexity
  - Fixed TypeScript import path errors by adding proper .js extensions

- Refactored GROQ controller to reduce complexity:
  - Split `searchContent` function into smaller, focused helper functions
  - Refactored `query` function to reuse the same helper functions
  - Extracted `processDocument` function to improve readability
  - Reduced cognitive complexity scores below the threshold of 10
  - Improved maintainability while preserving existing functionality
  - Ensured all tests pass with the refactored implementation

## [0.2.6] - 2025-03-08
### Fixed
- Improved developer workflow and test reliability:
  - Updated TypeScript configuration to improve developer experience
  - Modified `tsconfig.json` to allow dot notation for index signatures
  - Modified `tsconfig.test.json` to be more lenient during development
  - Fixed TypeScript errors in various controller files and utilities
  - Updated git hooks to improve developer workflow without sacrificing quality checks
  - Fixed import statements to properly use `import type` for type imports
  - Resolved issues with unit tests and critical integration tests
- Fixed schema file path in `config.ts` to use a relative path (`./schemas/[schema]`) instead of an absolute path:
  - Enhanced portability and developer experience by eliminating dependency on absolute paths
  - Resolved schema extraction errors in integration tests
  - Ensured tests are consistently passing across different environments
- Fixed integration tests:
  - All unit tests, controller tests, and integration tests now pass
  - Resolved schema-related errors in extended integration tests
  - Fixed release limit issues in standard integration tests

### Improved
- Quality dashboard and reporting:
  - Fixed dashboard display issue showing "0/0 NOT RUN" for tests
  - Added default values for test categories when tests fail to execute
  - Improved visual appearance with proper status labels and counts
  - Enhanced error handling in quality metrics calculation
- Development workflow:
  - Improved test run reliability across different environments
  - Added validation of test results before dashboard generation
  - Enhanced error handling for environment variable issues

## [0.2.3] - 2023-11-06
### Added
- GitHub Pages quality report workflow and visualization
  - Created automated GitHub Actions workflow for generating and publishing quality reports
  - Implemented HTML-based quality report with interactive charts and metrics
  - Added historical tracking of code quality metrics over time
  - Configured GitHub Pages deployment for public access to quality reports
  - Updated workflow to use latest GitHub Actions versions (v4)
  - Fixed workflow syntax issues for proper command execution in GitHub Actions
  - Enhanced error handling and visualization in the quality report

### Fixed
- TypeScript errors in multiple files:
  - Fixed `src/controllers/embeddings.ts` - removed unused imports and variables, fixed index signature access
  - Fixed `src/config/config.ts` - resolved module import issues and replaced `import.meta.url` with `path.resolve()`
  - Fixed `src/types/tools.ts` and `src/types/index.ts` - resolved type-only import issues
  - Fixed `src/controllers/mutate.ts` - removed unused function and fixed index signature access
  - Fixed `src/controllers/releases.ts` - fixed unused parameter warning
  - Added TypeScript checking to test scripts (`test:unit`, `test:all`, and `test:pre-commit`)
  - Completed all high-priority controller fixes and identified remaining TypeScript errors in the codebase
- Fixed GitHub Actions workflow for quality report generation with improved HTML generation process

## [0.2.0] - 2025-03-07
### Added
- GitHub Pages workflow for quality reports
  - Automated generation and publishing of quality metrics to GitHub Pages
  - Interactive dashboard showing code quality trends over time
  - Visualization of test coverage, complexity, and other metrics
  - Automatic deployment triggered by pushes to main branch and new tags
- Optimized test execution with parallel configuration using Vitest workspaces
  - Configured dedicated workspaces for unit and integration tests
  - Set up thread pool for optimal multi-core utilization
  - Reduced overall test execution time
- Comprehensive parameter validation system
  - Created shared validation utilities in `src/utils/parameterValidation.ts`
  - Implemented validation for required parameters across all controllers
  - Added type-specific validation for document IDs, mutations, GROQ queries, etc.
  - Added tests for validation utilities to ensure proper error handling
- Default values system for consistent parameter handling
  - Created default values utilities in `src/utils/defaultValues.ts`
  - Implemented default values for common parameters (projectId, dataset, pagination, etc.)
  - Added utility functions to apply defaults consistently across controllers
  - Added tests for default values utilities
- Comprehensive parameter validation system with Zod schemas
- Default values system for mutation operations
- Automated tests for type consistency between tools and controllers
- Type validation utilities for ensuring consistency between schemas and implementations

### Changed
- Improved error handling in controllers with more descriptive error messages
- Enhanced type safety by using validation utilities instead of inline checks
- Updated mutate controller to use parameter validation and default values
- Refactored tests to properly mock validation and default value utilities
- Adopted Sanity's ESLint and TypeScript configurations for better code quality

## [0.1.5] - 2025-03-14
### Changed
- Reorganized project structure by moving configuration files to a dedicated `config/` directory
  - Moved `tsconfig.json` to `config/tsconfig.json`
  - Moved `vitest.config.ts` to `config/vitest.config.ts`
  - Updated npm scripts to reference new file locations

### Added
- Unified type definitions across controllers and tools
  - Created shared interfaces in `src/types/sharedTypes.ts`
  - Updated tool definitions to use shared parameter interfaces
  - Ensured consistent type safety between controllers and their tool counterparts
  - Added proper handling of optional projectId and dataset parameters
  - Implemented type conversion for parameters that need it (e.g., string to string[])

## [0.1.4] - 2025-03-07
### Added
- Central logger utility redirecting all output to stderr to avoid MCP protocol interference
- Comprehensive integration test for the Sanity MCP server
- New TODO list with prioritized improvements
- Ultra-minimal core test approach focusing on essential document operations
- New core test script to verify only the most fundamental operations
  - `test:core`: Only runs the essential document operations test (create, read, update, delete)
  - Updated pre-commit hook to run just unit tests and core test
- Optimized integration test organization with three categories: critical, standard, and extended
- New npm scripts for targeted test runs:
  - `test:integration:critical`: Only runs critical integration tests (fast, pre-commit)
  - `test:integration:standard`: Runs the standard integration test suite (pre-merge)
  - `test:integration:extended`: Runs extended integration tests (comprehensive but slow)
  - `test:pre-commit`: Runs unit tests + core test (minimal & fast)
  - `test:pre-merge`: Runs unit tests + critical and standard integration tests
- Integration Test Optimization:
  - Split integration tests into three categories (Critical, Standard, Extended)
  - Added new npm scripts for targeted test runs
  - Created GitHub Actions workflow for optimized CI testing
  - Updated pre-commit and pre-push hooks
- Improved core document operations tests to use client.getDocument() for reliable document retrieval
- Performance optimizations for core tests:
  - Implemented smart polling with predicate conditions instead of fixed delays
  - Reduced polling intervals from 1000ms to 300ms
  - Added parallel execution for document deletion checks
  - Reduced test execution time by ~35% (from ~9s to ~6s)
- Enhanced document testing with better error logging and fallback mechanisms for draft and published documents
- Quality metrics tracking system that captures code quality data on each release
- Interactive chart visualization of quality metrics over time
- Automatic quality checkpoint generation when creating or checking out tags
- NDJSON format storage for quality metrics history

### Changed
- Fixed schema tools to mark `projectId` and `dataset` as required parameters
- Enhanced JSON response formatting for complex objects
- Improved error handling for MCP tool execution
- Replaced console.log/error calls with structured logging to stderr
- Modified document operations tests to use client.transaction() directly for updates and patches
- Made tests more resilient by using consistent document ID tracking between operations

### Fixed
- Fixed MCP protocol communication by ensuring clean stdout channel
- Fixed schema tools parameter requirements to match implementation
- Fixed JSON response formatting for complex objects
- Fixed issue with document updating and verification by ensuring draft documents are properly handled
- Updated all GitHub Actions to latest versions (v4) to prevent deprecation warnings
- Fixed TypeScript errors in configuration file to improve type safety
- Fixed workflow syntax issues with command substitution in GitHub Actions

## [0.1.3] - 2025-03-07
### Fixed
- Enhanced type safety with proper interfaces for SanityDocument, SanityPatch, and SanityTransaction 
- Fixed compatibility issues with @sanity/client types
- Improved error handling with consistent error response formats
- Fixed transaction patch type conflicts
- Added better type checking for mutations and document operations
- Ensured backward compatibility with test environment
- Fixed GROQ controller test compatibility by conditionally handling fetch parameters

### Code Quality
- Reduced cognitive complexity across multiple controllers
- TSLint report: 381 warnings (0 errors) after disabling strict linting in test files
- Updated ESLint configuration to be more lenient with test files
- Test suite: 129 tests passing (100%)
- Improved type safety across the codebase, particularly in sanity.ts and documentHelpers.ts

## [0.1.2] - 2025-03-07
### Added
- Utility module `documentHelpers.ts` for common document operations
- Added new interfaces in `sanity.ts`:
  - `InsertOperation`: Type-safe interface for array insert operations
  - `PatchOperations`: Type-safe interface for document patch operations
- ESLint configuration for TypeScript code quality
- Test-specific ESLint rules to prevent noise in test files
- Code coverage reporting with Vitest
- SonarJS and complexity plugins for ESLint
- Code duplication detection with jscpd
- Automated quality reporting with impact/effort prioritization
- New npm scripts:
  - `find:duplicates`: Find duplicate code blocks
  - `complexity`: Check for cyclomatic and cognitive complexity
  - `quality:check`: Run all quality checks
  - `quality:analyze`: Generate prioritized improvement recommendations
  - `quality:save-snapshot`: Save a quality metrics snapshot
  - `quality:visualize`: Generate interactive dashboard
  - `quality:dashboard`: Generate dashboard with test results
  - `quality:full-report`: Run analysis and generate dashboard

### Changed
- Refactored `applyPatchOperations` function in `documentHelpers.ts` to improve type safety and preserve backward compatibility
  - Added proper type safety using the new `PatchOperations` interface
  - Maintained consistent parameter order to prevent breaking existing tests
  - Enhanced error handling for insert operations
- Updated function calls in `mutate.ts` and `actions.ts` to use the refactored `applyPatchOperations` function
- Refactored `editDocument` function to reduce cognitive complexity
- Refactored `createDocumentVersion` function to reduce cognitive complexity
- Refactored `modifyDocuments` function in `controllers/mutate.ts` to reduce cognitive complexity
- Refactored `addDocumentToRelease` and `removeDocumentFromRelease` functions in `controllers/releases.ts`
- Refactored `createDocument` and `deleteDocument` functions in `controllers/actions.ts`
- Refactored `createRelease` function in `controllers/releases.ts`
- Simplified `applyInsertOperation` function to handle insert operations more efficiently
- Enhanced type safety in various utility functions and controllers by replacing `any` types with specific types
- Improved project structure by moving configuration files into dedicated directories:
  - Configuration files moved to `config/` directory
  - Quality scripts and output moved to `scripts/quality/` directory

### Removed
- Removed `modifyPortableTextField` functionality and related code from controllers, tools, and tests
- `PortableTextOperation` interface
- `mutateTextField` tool which was no longer being used
- Removed redundant `PortableTextOperation` interfaces from type definitions

### Fixed
- Fixed type definitions in controllers to ensure backward compatibility with existing tests
- Improved error handling consistency across controllers
- Converted variable declarations from 'let' to 'const' where appropriate

## [0.1.1] - 2024-10-25
### Added
- `find-complex-functions.js` script to identify functions with high cognitive complexity
- Configured ESLint with SonarJS plugin to enforce cognitive complexity limits
- Initial implementation of Content Releases API
- Support for adding and removing documents from releases
- Release scheduling and publishing
- Support for release versions and history

### Changed
- Refactored tools architecture to use specialized tool providers for each domain area
- Created a central tools registry in the `src/tools/index.ts` file
- Improved modularity and organization of tool definitions
- Moved tools-related tests to a dedicated `test/tools` directory
- Refactored tools architecture to use specialized tool providers for each domain area

### Fixed
- Fixed tests for the new tools structure
- Ensured tool names are consistent across all provider implementations

## [0.1.0] - 2025-03-07

### Added
- Integration tests for release document workflow
- Integration tests for array parameter deserialization

### Changed
- Updated all document-related API endpoints to handle both single document IDs and arrays of document IDs consistently
- Standardized parameter naming across all functions to use `documentId` for both single IDs and arrays of IDs
- Enhanced transaction handling for operations involving multiple documents

### Fixed
- Fixed the schema command for single types
- Fixed TypeScript errors in test files
- Improved error handling when operations fail with empty arrays or missing required fields
- Resolved serialization issues for arrays over the protocol

### Removed
- Redundant endpoints for single and multiple document operations