# Sanity MCP server

Sanity MCP Server implements the Model Context Protocol to standardise how AI models interact with Sanity’s content management system. It provides tools for retrieving and managing documents, executing GROQ queries, handling releases, and managing datasets. Additionally, it supports schema inspection and semantic search using embeddings, ensuring efficient and structured content operations.

## MCP Functionality
### General Tools

- **get_initial_context** – Should always be called before using any other tools to fetch initial context and usage instructions for this MCP server.
- **get_sanity_config** – Retrieves current Sanity configuration from environment variables (projectId, dataset, apiVersion, useCdn, perspective).
- **get_projects** – Fetches information about projects you have access to.
- **get_studios** – Lists all studio hosts for a given project.

### Document Management

- **get_document_by_id** – Retrieves a single Sanity document by its ID.
- **get_documents_by_ids** – Retrieves multiple Sanity documents using a list of IDs.
- **create_document** – Creates a new document in the Sanity dataset. (Ensure schema validation before creating.)
- **create_multiple_documents** – Creates multiple documents in a single transaction. (Schema validation required.)
- **patch_document** – Updates an existing document. (Ensure schema validation.)
- **delete_document** – Deletes a document from the dataset.
- **delete_multiple_documents** – Deletes multiple documents via IDs or a GROQ query.
- **modify_document** – Applies a single mutation (create, patch, delete) to a document.
- **modify_multiple_documents** – Applies multiple mutations in a single transaction.
- **batch_mutations** – Executes multiple mutations (create, replace, patch, delete) in a single batch.
- **publish_document** – Publishes a draft document.
- **publish_multiple_documents** – Publishes multiple draft documents.
- **unpublish_document** – Unpublishes a document.
- **unpublish_multiple_documents** – Unpublishes multiple documents.

### Release Management

- **add_document_to_release** – Adds a document to a release.
- **add_multiple_documents_to_release** – Adds multiple documents to a release.
- **create_release** – Creates a new release.
- **list_release_documents** – Lists all documents within a release.
- **unpublish_document_from_release** – Unpublishes a document from a release.
- **unpublish_multiple_documents_from_release** – Unpublishes multiple documents from a release.
- **remove_document_from_release** - Remove a staged change/document from release.
- **update_release_information** - Update title or description of a release .

### Dataset Management

- **create_dataset** – Creates a new dataset with optional public/private settings.
- **update_dataset** – Updates dataset settings (name, access control).
- **delete_dataset** – Deletes a dataset and all its content (irreversible).
- **get_datasets** – Lists all available datasets with details

### GROQ Querying

- **get_groq_specification** – Retrieves the GROQ language specification.
- **execute_groq_query** – Runs a GROQ query on the dataset.

### Embeddings **& Search**

- **list_embeddings_indices** – Lists all available embedding indices.
- **semantic_search** – Executes a semantic search on an embeddings index.

### Schema:

- **get_schema_overview** – Provides an overview of schema types.
- **get_type_schema_details** – Retrieves detailed schema information, including field descriptions.

## Development

Install the dependencies with `pnpm install`

Rebuild and restart the server on every change with `pnpm run dev`

Build the server with `pnpm run build`

Run the server with `pnpm start`

### Claude Desktop Configuration

To connect Claude Desktop to this MCP server, your configuration should look like this:

```json
{
  "mcpServers": {
    "sanity": {
      "command": "node",
      "args": ["/Users/<username>/<path-to-project>/sanity-mcp-server/build/index.js"],
      "env": {
        "SANITY_PROJECT_ID": "",
        "SANITY_DATASET": "",
        "SANITY_API_TOKEN": "",
        "SANITY_API_HOST": "https://api.sanity.io",
        "SANITY_API_VERSION": "vX",
        "SANITY_PERSPECTIVE": "drafts"
      }
    }
  }
}
```

### Adding New Tools

The project is structured by separating the tools into different categories where each category has its own register function and schemas.
```
----- template strucure -----
<category> - tool category folder
  <tool files> - one file per tool
  ... 
  schemas.ts -> contains all zod schemas used used within the category
  register.ts -> exports a function registering the category tools 
  
register.ts - registers all categroies tools to the server

----- example -----
tools
- releases - tool category
  addTool
  ...
  schemas.ts -> contains all zod schemas used by the LLM
  register.ts -> exports a function registering all release tools
- groq
  someTool
  ...
  schemas.ts -> contains all zod schemas used by the LLM
  register.ts -> exports a function registering all release tools 
... 	
register.ts - registers all categroy tools to the server
```

### Debugging

A nice way to debug is to use the [modelcontextprotocol inspector](https://github.com/modelcontextprotocol/inspector):

Fill in the env configs and run this command. You will get a local web app that can be used for listing and running tools.

```
npx @modelcontextprotocol/inspector -e SANITY_API_TOKEN=<token> -e SANITY_PROJECT_ID=<project_id> -e SANITY_DATASET=<ds> -e SANITY_API_VERSION=<v> -e SANITY_API_HOST=<host> -e SANITY_PERSPECTIVE=<perspective> node <ABSOLUTE_PATH_TO>/build/index.js
```
