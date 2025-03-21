import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sanityClient } from "../../config/sanity.js";

export function registerConfigTools(server: McpServer) {
  server.tool(
    "config",
    "Get current Sanity configuration information from environment variables",
    {
      random_string: z.string().describe("Dummy parameter for no-parameter tools"),
    },
    async () => {
      const config = sanityClient.config();
      
      return {
        content: [
          {
            type: "text",
            text: `Current Sanity Configuration:
Project ID: ${config.projectId}
Dataset: ${config.dataset}
API Version: ${config.apiVersion}
Using CDN: ${config.useCdn}`,
          },
        ],
      };
    }
  );
} 