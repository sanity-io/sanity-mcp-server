# Changelog

All notable changes to the Sanity MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
