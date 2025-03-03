# Sanity MCP Server

An implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.ai/) server for Sanity.io.

## Overview

This server implements the MCP protocol using stdio transport, making it suitable for direct integration with LLM assistants that support the MCP protocol. The server provides tools for interacting with Sanity's content management system.

## Installation

```bash
npm install
```

## Usage

### Using as a direct command line tool

```bash
./src/index.js
```

### Integration with AI assistants

The server can be integrated with AI assistants that support the MCP protocol. It uses stdio transport (standard input/output) to communicate.

To see an example of how to integrate with the MCP client, check out the `usage-example.js` file.

## Available Tools

The server provides the following tools:

- `listOrganizationsAndProjects`: Lists all organizations and their projects
- `listStudios`: Lists all studios for a specific project
- `getSchema`: Gets the full schema for a project and dataset
- `getSchemaForType`: Gets the schema definition for a specific document type
- `searchContent`: Searches for content using GROQ query language
- `publishDocument`: Publishes a document
- `unpublishDocument`: Unpublishes a document
- `createRelease`: Creates a new content release
- `addDocumentToRelease`: Adds a document to a content release

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SANITY_TOKEN=your_sanity_api_token
SANITY_PROJECT_ID=your_sanity_project_id
SANITY_DATASET=your_sanity_dataset
SANITY_API_VERSION=your_sanity_api_version
# Add any other required environment variables
```

## Development

Start the server with:

```bash
npm run dev
```

To add new tools or modify existing ones, update the tool definitions in `src/index.js` and implement the appropriate controller functions.

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
