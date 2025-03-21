import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerExampleTools(server: McpServer) {
  server.tool(
    "greet",
    "Generate a personalized greeting message",
    {
      name: z.string().describe("The name of the person to greet"),
      language: z.enum(["en", "es", "fr"]).optional().describe("The language to use for the greeting"),
    },
    async ({ name, language = "en" }) => {
      const greetings = {
        en: "Hello",
        es: "Hola",
        fr: "Bonjour",
      };

      return {
        content: [
          {
            type: "text",
            text: `${greetings[language]}, ${name}! Welcome to our Sanity MCP server.`,
          },
        ],
      };
    }
  );
}
