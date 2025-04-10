# Sanity MCP Server

Sanity MCP Server implements the Model Context Protocol to enable AI models to interact with Sanity's content management system. It provides tools for content creation, retrieval, and management, executing GROQ queries, handling releases, working with datasets, and more.

## Available Tools

### Context & Setup

- **get_initial_context** – IMPORTANT: Must be called before using any other tools to initialize context and get usage instructions.
- **get_sanity_config** – Retrieves current Sanity configuration (projectId, dataset, apiVersion, etc.)

### Document Operations

- **create_document** – Create a new document with AI-generated content based on instructions
- **update_document** – Update an existing document with AI-generated content based on instructions
- **patch_document** - Apply direct patch operations to modify specific parts of a document without using AI generation
- **query_documents** – Execute GROQ queries to search for and retrieve content
- **document_action** – Perform document actions like publishing, unpublishing, or deleting documents

### Release Management

- **list_releases** – List content releases, optionally filtered by state
- **create_release** – Create a new content release
- **edit_release** – Update metadata for an existing release
- **schedule_release** – Schedule a release to publish at a specific time
- **release_action** – Perform actions on releases (publish, archive, unarchive, unschedule, delete)

### Version Management

- **create_version** – Create a version of a document for a specific release
- **discard_version** – Delete a specific version document from a release
- **mark_for_unpublish** – Mark a document to be unpublished when a specific release is published

### Dataset Management

- **get_datasets** – List all datasets in the project
- **create_dataset** – Create a new dataset
- **update_dataset** – Modify dataset settings

### Schema Information

- **get_schema** – Get schema details, either full schema or for a specific type
- **list_schema_ids** – List all available schema IDs

### GROQ Support

- **get_groq_specification** – Get the GROQ language specification summary

### Embeddings & Semantic Search

- **list_embeddings_indices** – List all available embeddings indices
- **semantic_search** – Perform semantic search on an embeddings index

### Project Information

- **list_projects** – List all Sanity projects associated with your account
- **get_project_studios** – Get studio applications linked to a specific project

## Usage

This MCP server is designed to be used with AI models that support the Model Context Protocol, such as Claude via Claude Desktop or other MCP-compatible interfaces.

### Configuration

The server requires the following environment variables:

```
SANITY_API_TOKEN - Your Sanity API token
SANITY_PROJECT_ID - Your Sanity project ID
SANITY_DATASET - The dataset to use
SANITY_API_HOST - Optional, defaults to https://api.sanity.io
MCP_USER_ROLE - Optional, determines tool access level (developer or editor)
```

## Development

Install dependencies:

```
pnpm install
```

Build and run in development mode:

```
pnpm run dev
```

Build the server:

```
pnpm run build
```

Run the built server:

```
pnpm start
```

### Connecting with Claude Desktop

To use this MCP server with Claude Desktop, add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "sanity": {
      "command": "npx",
      "args": [
        "-y",
        "@sanity/mcp-server@latest",
        "--dataset",
        "production",
        "--project-id",
        "your-project-id",
        "--token",
        "<sanity-api-token>"
      ]
    }
  }
}
```

### User Roles

The server supports three user roles:

- **developer**: Access to all tools
- **editor**: Content-focused tools without project administration

### Debugging

For debugging, you can use the MCP inspector:

```bash
npx @modelcontextprotocol/inspector -e SANITY_API_TOKEN=<token> -e SANITY_PROJECT_ID=<project_id> -e SANITY_DATASET=<ds> -e MCP_USER_ROLE=developer node path/to/build/index.js
```

This will provide a web interface for inspecting and testing the available tools.
