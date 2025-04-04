# Sanity MCP server

## Development

Install the dependencies with `pnpm install`

Rebuild and restart the server on every change with `pnpm run dev`

Build the server with `pnpm run build`

Run the server with `pnpm start`

## Claude Desktop Configuration

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
