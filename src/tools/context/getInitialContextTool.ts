import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";
import { getDatasetsTool } from "../datasets/getDatasetsTool.js";
import { listSchemaTypesTool } from "../schema/listSchemaTypesTool.js";
import { listEmbeddingsIndicesTool } from "../embeddings/listEmbeddingsTool.js";
import { listAllReleases } from "../releases/listReleaseDocuments.js";
import { getSanityConfigTool } from "../config/getSanityConfigTool.js";

let contextInitialized = false;

export function hasInitialContext(): boolean {
  return contextInitialized;
}

export async function getInitialContextTool(
  args: {},
  extra: RequestHandlerExtra
) {
  try {
    const config = await getSanityConfigTool({}, extra);
    const datasets = await getDatasetsTool({}, extra);
    const schemaTypes = await listSchemaTypesTool({}, extra);
    const embeddings = await listEmbeddingsIndicesTool({}, extra);
    //TODO: only active releases should be listed
    const releases = await listAllReleases();

    contextInitialized = true;

    const outputText = `Sanity MCP Server:

CONFIG & DATASETS
${config.content[0].text}
${datasets.content[0].text}

SCHEMA TYPES: ${schemaTypes.content[0].text}

EMBEDDINGS: ${embeddings.content[0].text}

RELEASES: ${releases.content[0].text}`;

    return {
      content: [
        {
          type: "text" as const,
          text: outputText,
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Error getting context: ${error}`,
        },
      ],
    };
  }
}
