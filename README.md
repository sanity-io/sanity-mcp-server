# Sanity MCP Server

An implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Sanity.io.

## Overview

This server implements the MCP protocol using stdio transport, making it suitable for direct integration with LLM assistants that support the MCP protocol. The server provides tools for interacting with Sanity's content management system.

## Technical Details

- Built with TypeScript for type safety and better developer experience
- Uses Vitest for testing, with better ES Modules support
- Implements controllers for various Sanity.io features:
  - `actions.ts`: Document publishing and unpublishing operations
  - `embeddings.ts`: Embeddings and semantic search
  - `groq.ts`: GROQ queries and real-time updates
  - `mutate.ts`: Document mutations and modifications
  - `releases.ts`: Content release management
  - `schema.ts`: Schema type information
  - `tools.ts`: Tool definitions for MCP

## Available Tools

The server provides the following tools:

- **GROQ Queries**
  - `query`: Executes GROQ queries (formerly `searchContent`)
  - `subscribeToUpdates`: Subscribes to real-time updates for documents
  - `getGroqSpecification`: Gets the GROQ query language specification

- **Document Retrieval**
  - `getDocument`: Gets a document by ID or multiple documents by their IDs
  - `getDocuments`: Gets multiple documents by their IDs (alternative to using `getDocument` with an array)

- **Document Mutations**
  - `createDocument`: Creates a new document
  - `updateDocument`: Updates one or more existing documents
  - `mutateDocument`: Performs multiple operations on a single document
  - `deleteDocument`: Deletes one or more documents
  - `batchMutations`: Performs multiple mutations across different documents
  - `updatePortableText`: Updates Portable Text fields (formerly `modifyPortableTextField`)

- **Document Actions**
  - `publishDocument`: Publishes one or more documents
  - `unpublishDocument`: Unpublishes one or more documents
  - `createRelease`: Creates a new content release
  - `addDocumentToRelease`: Adds a document to a content release
  - `removeDocumentFromRelease`: Removes one or more documents from a content release
  - `listReleaseDocuments`: Lists documents in a release
  - `createDocumentVersion`: Creates a version of one or more documents in a specific release
  - `unpublishDocumentWithRelease`: Marks one or more documents for unpublishing when a release is published

- **Schema Management**
  - `listSchemaTypes`: Lists available schema types
  - `getTypeSchema`: Gets detailed schema for a specific type

- **Embeddings and Semantic Search**
  - `semanticSearch`: Performs semantic search on embeddings indices
  - `listEmbeddingsIndices`: Lists available embeddings indices

- **Project Management**
  - `listOrganizationsAndProjects`: Lists all organizations and their projects
  - `listStudios`: Lists all studios for a specific project

## Installation

```bash
npm install
```

## Building and Running

This project is built with TypeScript. To compile the TypeScript files to JavaScript:

```bash
npm run build
```

### Development Mode

Start the development server with automatic recompilation and restart on changes:

```bash
npm run dev
```

This uses `tsc -w` to watch TypeScript files and recompile them when they change, plus `node --watch` to restart the server when the compiled JavaScript changes.

### Production Mode

For production or regular usage:

```bash
npm run build
npm start
```

## Usage

### Using as a direct command line tool

```bash
npm start
```

Or after building:

```bash
node dist/index.js
```

### Integration with AI assistants

The server can be integrated with AI assistants that support the MCP protocol. It uses stdio transport (standard input/output) to communicate.

To see an example of how to integrate with the MCP client, check out the `usage-example.ts` file.

#### Claude AI Configuration Example

For Anthropic's Claude AI, you can configure it to use this MCP server by adding the following to your Claude configuration:

```json
{
  "tools": [
    {
      "name": "sanity-mcp",
      "type": "mcp",
      "path": "/path/to/sanity-mcp-server/dist/index.js",
      "env": {
        "SANITY_TOKEN": "your_sanity_api_token",
        "SANITY_PROJECT_ID": "your_sanity_project_id",
        "SANITY_DATASET": "your_sanity_dataset",
        "SANITY_API_VERSION": "2025-03-15"
      }
    }
  ]
}
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SANITY_TOKEN=your_sanity_api_token
SANITY_PROJECT_ID=your_sanity_project_id
SANITY_DATASET=your_sanity_dataset
SANITY_API_VERSION=your_sanity_api_version
# Optional: for LLM verification of content
OPENAI_API_KEY=your_openai_api_key
```

## Development

### Project Structure

The project is organized as follows:

- `src/`: Source code
  - `controllers/`: Controller modules for different Sanity features
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions
  - `config/`: Configuration files
- `config/`: Configuration files for development tools
  - `.eslintrc.json`: ESLint configuration
  - `.eslintignore`: Files to ignore in ESLint
  - `tsconfig.test.json`: TypeScript configuration for tests
- `scripts/`: Development and build scripts
  - `quality/`: Code quality measurement scripts and outputs
    - `find-complex-functions.js`: Identifies complex functions
    - `prioritize-improvements.js`: Generates prioritized improvement recommendations
    - `output/`: Output files from quality checks
- `test/`: Test files
  - `unit/`: Unit tests
  - `integration/`: Integration tests
- `schemas/`: Sanity schema files (not tracked in version control)

### Code Quality Tools

The project includes several tools for maintaining code quality:

#### Static Analysis

```bash
# Run ESLint for static code analysis
npm run lint

# Run ESLint and auto-fix issues where possible
npm run lint:fix
```

#### Complexity Analysis

```bash
# Identify functions with high cognitive complexity
npm run complexity
```

This generates a report at `scripts/quality/output/complexity-report.json` highlighting functions that exceed the recommended complexity threshold of 10.

#### Code Duplication Detection

```bash
# Find duplicate code blocks
npm run find:duplicates
```

This generates an HTML report at `scripts/quality/output/html/index.html` showing duplicated code blocks across the codebase.

#### Code Coverage

```bash
# Run tests with coverage reporting
npm run test:coverage
```

This generates a coverage report in the `coverage` directory, showing which parts of the codebase are covered by tests.

#### Combined Quality Check

```bash
# Run all quality checks at once
npm run quality:check

# Generate a prioritized report of quality improvements
npm run quality:report
```

The `quality:report` command analyzes the output from all quality tools and generates a prioritized list of recommended improvements at `scripts/quality/output/improvement-recommendations.md`, sorted by impact/effort ratio.

Additionally, it tracks key quality metrics over time by saving a checkpoint in NDJSON format at `scripts/quality/quality-tag-checkpoint.ndjson` and generates an interactive chart at `scripts/quality/output/quality-metrics-chart.html`.

#### Quality Metrics Tracking

The project automatically tracks quality metrics over time, generating historical data that can be used to monitor progress and improvements:

```bash
# Generate a quality metrics checkpoint without running full checks
npm run quality:checkpoint

# Generate an interactive chart from checkpoint data
npm run quality:chart
```

Quality metrics are automatically captured when:
- Running the full `quality:report` script
- Creating a new release with `npm run release`
- Checking out a tag with `git checkout v1.2.3`

The metrics tracked include:
- Test coverage percentages and distribution
- ESLint errors and warnings
- Cyclomatic and cognitive complexity
- Code duplication percentages

The generated chart provides a visual representation of these metrics over time, making it easy to track progress and identify areas that need improvement.

#### GitHub Pages Quality Report

The project now includes a GitHub Pages site that automatically generates and publishes quality reports. You can access the latest quality report at:

[https://sanity-io.github.io/sanity-mcp-server/](https://sanity-io.github.io/sanity-mcp-server/)

This report is automatically updated whenever:
- Changes are pushed to the main branch
- A new release tag is created

The GitHub Pages report includes:
- Code quality metrics (warnings, errors, duplications, complex functions)
- Test coverage statistics
- Prioritized improvement opportunities
- Historical trends showing how code quality metrics change over time

This provides an easy way to monitor the health of the codebase and identify areas for improvement.

### Type Checking

Run the TypeScript type checker:

```bash
npm run typecheck
```

### Testing

Run tests:

```bash
npm test
```

Or in watch mode:

```bash
npm run test:watch
```

## Schema Management

Schema files for Sanity projects are stored in the `schemas/` directory but not tracked in version control. When working with a new Sanity project:

1. Create a schema file named `{projectId}_{dataset}.json` in the `schemas/` directory
2. The schema file should contain the exported schema from your Sanity project
3. The MCP server will automatically load the appropriate schema based on the project ID and dataset specified in environment variables

For example, for a project with ID `zwl9ofqf` and dataset `production`, create:
```
schemas/zwl9ofqf_production.json
```

## MCP Tool Invocation in Different Environments

### Cursor
In Cursor, MCP tools are invoked using the pattern:
```javascript
mcp__toolName({ param1: "value1", param2: "value2" })
```

For example, to use the echo tool:
```javascript
mcp__echo({ message: "Hello World" })
```

### Claude Desktop
Note that this differs from Claude Desktop, where tools are invoked using:
```javascript
mcp__serverName__toolName({ param1: "value1", param2: "value2" })
```

For example:
```javascript
mcp__minimal__echo({ message: "Hello World" })
```

This difference in naming conventions can cause confusion when moving between environments. Cursor treats all MCP tools in a flat namespace without requiring the server name prefix.

Since Anthropic (creator of Claude) is the maintainer of the MCP standard, the Claude Desktop pattern with server name included is the recommended approach for cross-platform compatibility.

## Quality Metrics


This section provides links to the latest quality metrics for this project.

### Latest Quality Metrics Summary - March 8, 2025

**Version:** 0.2.5 (v0.2.5)

Key metrics at a glance:
- Test Coverage: 56.45%
- ESLint Issues: 2 errors, 37 warnings
- Complex Functions: 0
- Code Duplication: 4.26%

#### Detailed Quality Information

- [📊 Interactive Quality Metrics Dashboard](./scripts/quality/output/quality-metrics-chart.html) - Visual trends of code quality over time
- [📝 Quality Improvement Recommendations](./scripts/quality/output/improvement-recommendations.md) - Prioritized list of suggested improvements
- [📈 Raw Quality Data (NDJSON)](./scripts/quality/quality-tag-checkpoint.ndjson) - Historical quality metrics for all releases

Quality metrics are automatically updated on each release and can be manually generated with `npm run quality:report`.

## License

MIT
