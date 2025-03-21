import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSanityConfigTool } from "./getSanityConfigTool.js";

export function registerConfigTools(server: McpServer) {
  server.tool(
    "get-sanity-config",
    "Get current Sanity configuration information from environment variables",
    {},
    getSanityConfigTool
  );
} 