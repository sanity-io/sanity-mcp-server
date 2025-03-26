import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDatasetsTool } from "./getDatasetsTool.js";
import {
  createDatasetParams,
  deleteDatasetParams,
  updateDatasetParams,
} from "./schemas.js";
import { createDatasetTool } from "./createDatasetTool.js";
import { updateDatasetTool } from "./updateDatasetTool.js";
import { deleteDatasetTool } from "./deleteDatasetTool.js";

export function registerDatasetsTools(server: McpServer) {
  server.tool(
    "get_datasets",
    "Get the list of datasets available in the project",
    {},
    getDatasetsTool
  );
  server.tool(
    "create_dataset",
    "Create a new dataset in the project",
    createDatasetParams,
    createDatasetTool
  );
  server.tool(
    "delete_dataset",
    "Delete a dataset from the project",
    deleteDatasetParams,
    deleteDatasetTool
  );
  server.tool(
    "update_dataset",
    "Update a dataset in the project",
    updateDatasetParams,
    updateDatasetTool
  );
}
