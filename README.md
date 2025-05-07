# Sanity MCP Server <!-- omit in toc -->

> Transform your content operations with AI-powered tools for Sanity. Create, manage, and explore your content through natural language conversations in your favorite AI-enabled editor.

Sanity MCP Server implements the [Model Context Protocol](https://modelcontextprotocol.ai) to connect your Sanity projects with AI tools like Claude, Cursor, and VS Code. It enables AI models to understand your content structure and perform operations through natural language instructions.

## ✨ Key Features <!-- omit in toc -->

- 🤖 **Content Intelligence**: Let AI explore and understand your content library
- 🔄 **Content Operations**: Automate tasks through natural language instructions
- 📊 **Schema-Aware**: AI respects your content structure and validation rules
- 🚀 **Release Management**: Plan and organize content releases effortlessly
- 🔍 **Semantic Search**: Find content based on meaning, not just keywords

## Table of Contents <!-- omit in toc -->

- [🔌 Quickstart](#-quickstart)
  - [Prerequisites](#prerequisites)
  - [Add configuration for the Sanity MCP server](#add-configuration-for-the-sanity-mcp-server)
- [🛠️ Available Tools](#️-available-tools)
- [⚙️ Configuration](#️-configuration)
  - [🔑 API Tokens and Permissions](#-api-tokens-and-permissions)
  - [👥 User Roles](#-user-roles)
- [📦 Node.js Environment Setup](#-nodejs-environment-setup)
  - [🛠 Quick Setup for Node Version Manager Users](#-quick-setup-for-node-version-manager-users)
  - [🤔 Why Is This Needed?](#-why-is-this-needed)
  - [🔍 Troubleshooting](#-troubleshooting)
- [💻 Development](#-development)
  - [Debugging](#debugging)

## 🔌 Quickstart

### Prerequisites

Before you can use the MCP server, you need to:

1. **Deploy your Sanity Studio with schema manifest**

   The MCP server needs access to your content structure to work effectively. Deploy your schema manifest using one of these approaches:

   ```bash
   # Option A: If you have the CLI installed globally
   npm install -g sanity
   cd /path/to/studio
   SANITY_CLI_SCHEMA_STORE_ENABLED=true sanity schema deploy

   # Option B: Update your Studio
   cd /path/to/studio
   npm update sanity
   SANITY_CLI_SCHEMA_STORE_ENABLED=true npx sanity schema deploy
   ```

   > [!NOTE]
   > Schema deployment requires both the latest CLI version and the SANITY_CLI_SCHEMA_STORE_ENABLED flag. This feature will be enabled by default in a future release.

2. **Get your API credentials**
   - Project ID
   - Dataset name
   - API token with appropriate permissions

This MCP server can be used with any application that supports the Model Context Protocol. Here are some popular examples:

- [Claude Desktop](https://modelcontextprotocol.io/quickstart/user)
- [Cursor IDE](https://docs.cursor.com/context/model-context-protocol)
- [Visual Studio Code](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- Custom MCP-compatible applications

### Add configuration for the Sanity MCP server

To use the Sanity MCP server, add the following configuration to your application's MCP settings:

```json
{
  "mcpServers": {
    "sanity": {
      "command": "npx",
      "args": ["-y", "@sanity/mcp-server@latest"],
      "env": {
        "SANITY_PROJECT_ID": "your-project-id",
        "SANITY_DATASET": "production",
        "SANITY_API_TOKEN": "your-sanity-api-token"
      }
    }
  }
}
```

The exact location of this configuration will depend on your application:

| Application    | Configuration Location                            |
| -------------- | ------------------------------------------------- |
| Claude Desktop | Claude Desktop configuration file                 |
| Cursor         | Workspace or global settings                      |
| VS Code        | Workspace or user settings (depends on extension) |
| Custom Apps    | Refer to your app's MCP integration docs          |

You don't get it to work? See the section on [Node.js configuration](#-nodejs-environment-setup).

## 🛠️ Available Tools

### Context & Setup <!-- omit in toc -->

- **get_initial_context** – IMPORTANT: Must be called before using any other tools to initialize context and get usage instructions.
- **get_sanity_config** – Retrieves current Sanity configuration (projectId, dataset, apiVersion, etc.)

### Document Operations <!-- omit in toc -->

- **create_document** – Create a new document with AI-generated content based on instructions
- **update_document** – Update an existing document with AI-generated content based on instructions
- **patch_document** - Apply direct patch operations to modify specific parts of a document without using AI generation
- **query_documents** – Execute GROQ queries to search for and retrieve content
- **document_action** – Perform document actions like publishing, unpublishing, or deleting documents

### Release Management <!-- omit in toc -->

- **list_releases** – List content releases, optionally filtered by state
- **create_release** – Create a new content release
- **edit_release** – Update metadata for an existing release
- **schedule_release** – Schedule a release to publish at a specific time
- **release_action** – Perform actions on releases (publish, archive, unarchive, unschedule, delete)

### Version Management <!-- omit in toc -->

- **create_version** – Create a version of a document for a specific release
- **discard_version** – Delete a specific version document from a release
- **mark_for_unpublish** – Mark a document to be unpublished when a specific release is published

### Dataset Management <!-- omit in toc -->

- **get_datasets** – List all datasets in the project
- **create_dataset** – Create a new dataset
- **update_dataset** – Modify dataset settings

### Schema Information <!-- omit in toc -->

- **get_schema** – Get schema details, either full schema or for a specific type
- **list_schema_ids** – List all available schema IDs

### GROQ Support <!-- omit in toc -->

- **get_groq_specification** – Get the GROQ language specification summary

### Embeddings & Semantic Search <!-- omit in toc -->

- **list_embeddings_indices** – List all available embeddings indices
- **semantic_search** – Perform semantic search on an embeddings index

### Project Information <!-- omit in toc -->

- **list_projects** – List all Sanity projects associated with your account
- **get_project_studios** – Get studio applications linked to a specific project

## ⚙️ Configuration

The server takes the following environment variables:

| Variable            | Description                                        | Required |
| ------------------- | -------------------------------------------------- | -------- |
| `SANITY_API_TOKEN`  | Your Sanity API token                              | ✅       |
| `SANITY_PROJECT_ID` | Your Sanity project ID                             | ✅       |
| `SANITY_DATASET`    | The dataset to use                                 | ✅       |
| `SANITY_API_HOST`   | API host (defaults to https://api.sanity.io)       | ❌       |
| `MCP_USER_ROLE`     | Determines tool access level (developer or editor) | ❌       |

> [!WARNING]  
> **Using AI with Production Datasets**  
> When configuring the MCP server with a token that has write access to a production dataset, please be aware that the AI can perform destructive actions like creating, updating, or deleting content. This is not a concern if you're using a read-only token. While we are actively developing guardrails, you should exercise caution and consider using a development/staging dataset for testing AI operations that require write access.

### 🔑 API Tokens and Permissions

The MCP server requires appropriate API tokens and permissions to function correctly. Here's what you need to know:

1. **Generate a Robot Token**:

   - Go to your project's management console: Settings > API > Tokens
   - Click "Add new token"
   - Create a dedicated token for your MCP server usage
   - Store the token securely - it's only shown once!

2. **Required Permissions**:

   - The token needs appropriate permissions based on your usage
   - For basic read operations: `viewer` role is sufficient
   - For content management: `editor` or `developer` role recommended
   - For advanced operations (like managing datasets): `administrator` role may be needed

3. **Dataset Access**:

   - Public datasets: Content is readable by unauthenticated users
   - Private datasets: Require proper token authentication
   - Draft and versioned content: Only accessible to authenticated users with appropriate permissions

4. **Security Best Practices**:
   - Use separate tokens for different environments (development, staging, production)
   - Never commit tokens to version control
   - Consider using environment variables for token management
   - Regularly rotate tokens for security

### 👥 User Roles

The server supports two user roles:

- **developer**: Access to all tools
- **editor**: Content-focused tools without project administration

## 📦 Node.js Environment Setup

> **Important for Node Version Manager Users**: If you use `nvm`, `mise`, `fnm`, `nvm-windows` or similar tools, you'll need to follow the setup steps below to ensure MCP servers can access Node.js. This is a one-time setup that will save you troubleshooting time later. This is [an ongoing issue](https://github.com/modelcontextprotocol/servers/issues/64) with MCP servers.

### 🛠 Quick Setup for Node Version Manager Users

1. First, activate your preferred Node.js version:

   ```bash
   # Using nvm
   nvm use 20   # or your preferred version

   # Using mise
   mise use node@20

   # Using fnm
   fnm use 20
   ```

2. Then, create the necessary symlinks (choose your OS):

   **On macOS/Linux:**

   ```bash
   sudo ln -sf "$(which node)" /usr/local/bin/node && sudo ln -sf "$(which npx)" /usr/local/bin/npx
   ```

   > [!NOTE]
   > While using `sudo` generally requires caution, it's safe in this context because:
   >
   > - We're only creating symlinks to your existing Node.js binaries
   > - The target directory (`/usr/local/bin`) is a standard system location for user-installed programs
   > - The symlinks only point to binaries you've already installed and trust
   > - You can easily remove these symlinks later with `sudo rm`

   **On Windows (PowerShell as Administrator):**

   ```powershell
   New-Item -ItemType SymbolicLink -Path "C:\Program Files\nodejs\node.exe" -Target (Get-Command node).Source -Force
   New-Item -ItemType SymbolicLink -Path "C:\Program Files\nodejs\npx.cmd" -Target (Get-Command npx).Source -Force
   ```

3. Verify the setup:
   ```bash
   # Should show your chosen Node version
   /usr/local/bin/node --version  # macOS/Linux
   "C:\Program Files\nodejs\node.exe" --version  # Windows
   ```

### 🤔 Why Is This Needed?

MCP servers are launched by calling `node` and `npx` binaries directly. When using Node version managers, these binaries are managed in isolated environments that aren't automatically accessible to system applications. The symlinks above create a bridge between your version manager and the system paths that MCP servers use.

### 🔍 Troubleshooting

If you switch Node versions often:

- Remember to update your symlinks when changing Node versions
- You can create a shell alias or script to automate this:
  ```bash
  # Example alias for your .bashrc or .zshrc
  alias update-node-symlinks='sudo ln -sf "$(which node)" /usr/local/bin/node && sudo ln -sf "$(which npx)" /usr/local/bin/npx'
  ```

To remove the symlinks later:

```bash
# macOS/Linux
sudo rm /usr/local/bin/node /usr/local/bin/npx

# Windows (PowerShell as Admin)
Remove-Item "C:\Program Files\nodejs\node.exe", "C:\Program Files\nodejs\npx.cmd"
```

## 💻 Development

Install dependencies:

```bash
pnpm install
```

Build and run in development mode:

```bash
pnpm run dev
```

Build the server:

```bash
pnpm run build
```

Run the built server:

```bash
pnpm start
```

### Debugging

For debugging, you can use the MCP inspector:

```bash
npx @modelcontextprotocol/inspector -e SANITY_API_TOKEN=<token> -e SANITY_PROJECT_ID=<project_id> -e SANITY_DATASET=<ds> -e MCP_USER_ROLE=developer node path/to/build/index.js
```

This will provide a web interface for inspecting and testing the available tools.
