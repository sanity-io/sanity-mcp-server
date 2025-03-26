import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listSchemaTypesTool } from "./listSchemaTypesTool.js";
import { GetSchemaParams } from "./schema.js";
import { getTypeSchemaTool } from "./getTypeSchemaTool.js";

export function registerSchemaTools(server: McpServer) {
  server.tool(
    "list_schema_types",
    "List all schema types in the dataset",
    {},
    listSchemaTypesTool
  );
  server.tool(
    "get_type_schema",
    "Get detailed schema for a specific type",
    GetSchemaParams,
    getTypeSchemaTool
  );
}
