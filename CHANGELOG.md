# Changelog

All notable changes to the Sanity MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
  - `quality:report`: Generate prioritized improvement recommendations

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

## [0.1.0] - 2025-03-07T00:16:06+01:00 - Document API Consistency

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
