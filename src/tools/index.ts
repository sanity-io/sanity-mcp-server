import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerConfigTools } from "./config/index.js";
import { registerExampleTools } from "./example/index.js";

export function registerAllTools(server: McpServer) {
  registerConfigTools(server);
  registerExampleTools(server);
} 