# Sanity MCP Server

> **This local MCP server (`@sanity/mcp-server`) has been deprecated** in favor of the new, improved remote MCP server at [mcp.sanity.io](https://mcp.sanity.io). This repository is archived and no longer maintained.

## Use [mcp.sanity.io](https://mcp.sanity.io)

The Sanity MCP Server is now available as a hosted remote server at **[mcp.sanity.io](https://mcp.sanity.io)**. It offers:

- Streamable HTTP transport
- OAuth authentication (no API tokens to manage)
- Continuously updated tools and features
- Zero local setup — no Node.js required

### Quick setup

Add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "sanity": {
      "url": "https://mcp.sanity.io",
      "type": "http"
    }
  }
}
```

Visit **[mcp.sanity.io](https://mcp.sanity.io)** for full installation instructions for Claude Code, Cursor, VS Code, and other MCP clients.
