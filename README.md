# Sanity MCP server

## Development

Install the dependencies with `npm install`

Rebuild and restart the server on every change with `npm run dev`

Build the server with `npm run build`

Run the server with `npm start`

## Claude Desktop Configuration

To connect Claude Desktop to this MCP server, your configuration should look like this:

```json
{
  "mcpServers": {
    "sanity": {
      "command": "node",
      "args": ["/Users/rostimelk/Projects/prj-agent/mcp/build/index.js"],
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
