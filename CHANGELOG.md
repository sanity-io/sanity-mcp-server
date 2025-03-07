# Changelog

All notable changes to the Sanity MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- ESLint configuration for TypeScript code quality
- Test-specific ESLint rules to prevent noise in test files
- Code coverage reporting with Vitest

### Fixed
- Converted variable declarations from 'let' to 'const' where appropriate

## [0.1.1] - 2025-03-07T01:04:16+01:00 - Tools Structure Refactoring

### Changed
- Refactored tools architecture to use specialized tool providers for each domain area
- Created a central tools registry in the `src/tools/index.ts` file
- Improved modularity and organization of tool definitions
- Moved tools-related tests to a dedicated `test/tools` directory

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
