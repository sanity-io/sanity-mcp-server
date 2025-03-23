import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDocumentRetrivalTools } from "./retrieval/register.js";

export function registerDocumentTools(server: McpServer) {
  registerDocumentRetrivalTools(server);
}
