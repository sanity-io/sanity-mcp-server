import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProjectsTool } from "./getProjectsTool.js";

export function registerProjectsTools(server: McpServer) {
  server.tool(
    "get_projects",
    "Get information about projects you have access to",
    {},
    getProjectsTool
  );
}
