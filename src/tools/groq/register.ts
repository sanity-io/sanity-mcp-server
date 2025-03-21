import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGroqSpecificationTool } from "./getGroqSpecificationTool.js";

/**
 * Register all GROQ-related tools with the MCP server
 */
export function registerGroqTools(server: McpServer) {
  server.tool(
    "get_groq_specification",
    "Get the GROQ language specification",
    {},
    getGroqSpecificationTool
  );
}
