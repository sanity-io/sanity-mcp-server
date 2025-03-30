import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";

export async function getSanityConfigTool(
  args: {},
  extra: RequestHandlerExtra,
) {
  const config = sanityClient.config();

  return {
    content: [
      {
        type: "text" as const,
        text: `Current Sanity Configuration:
Project ID: ${config.projectId}
Dataset: ${config.dataset}
API Version: ${config.apiVersion}
Using CDN: ${config.useCdn}
Perspective: ${config.perspective}
`,
      },
    ],
  };
}
