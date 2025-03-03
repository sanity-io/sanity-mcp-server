# Sanity MCP Server

An implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.ai/) server for Sanity.io.

## Overview

This server implements the MCP protocol using stdio transport, making it suitable for direct integration with LLM assistants that support the MCP protocol. The server provides tools for interacting with Sanity's content management system.

## Technical Details

- Built with TypeScript for type safety and better developer experience
- Uses Vitest for testing, with better ES Modules support
- Implements controllers for various Sanity.io features

## Installation

```bash
npm install
```

## Building the Project

This project is built with TypeScript. To compile the TypeScript files to JavaScript:

```bash
npm run build
```

You can also start the development server with automatic recompilation:

```bash
npm run dev
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

To see an example of how to integrate with the MCP client, check out the `usage-example.js` file.

## Available Tools

The server provides the following tools:

- **Content Management**
  - `searchContent`: Searches for content using GROQ query language
  - `subscribeToUpdates`: Subscribes to real-time updates for documents

- **Schema Management**
  - `listSchemaTypes`: Lists available schema types
  - `getTypeSchema`: Gets detailed schema for a specific type

- **Document Actions**
  - `publishDocument`: Publishes a document
  - `unpublishDocument`: Unpublishes a document
  - `createRelease`: Creates a new content release
  - `addDocumentToRelease`: Adds a document to a content release
  - `listReleaseDocuments`: Lists documents in a release

- **Document Mutations**
  - `modifyDocuments`: Performs document mutations (create, update, delete)
  - `modifyPortableTextField`: Modifies Portable Text fields

- **Search**
  - `semanticSearch`: Performs semantic search on embeddings indices
  - `listEmbeddingsIndices`: Lists available embeddings indices

- **Project Management**
  - `listOrganizationsAndProjects`: Lists all organizations and their projects
  - `listStudios`: Lists all studios for a specific project

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

## License

MIT
