import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";
import { getDatasetsTool } from "../datasets/getDatasetsTool.js";
import { getSchemaTypes } from "../schema/listSchemaTypesTool.js";
import { listEmbeddingsIndicesTool } from "../embeddings/listEmbeddingsTool.js";
import { listReleases } from "../releases/listReleaseDocuments.js";
import { getSanityConfigTool } from "../config/getSanityConfigTool.js";
import { getSchema } from "../schema/getTypeSchemaTool.js";

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
    const schemaTypes = await getSchemaTypes();
    const schemaTypesText = `Available schema types: ${schemaTypes.join(", ")}`;
    const schemaPromises = schemaTypes.map(async (type) => {
      try {
        const schema = await getSchema(type);
        return `\nSchema for type ${type}:\n${schema}`;
      } catch (error) {
        return `\nError getting schema for type ${type}: ${error}`;
      }
    });

    const resolvedSchemas = await Promise.all(schemaPromises);
    const schemaText = schemaTypesText + resolvedSchemas.join("\n");

    const embeddings = await listEmbeddingsIndicesTool({}, extra);
    const activeReleases = await listReleases(sanityClient);
    const activeReleasesText = JSON.stringify(activeReleases);

    contextInitialized = true;

    const outputText = `Sanity MCP Server:

CONFIG & DATASETS
${config.content[0].text}
${datasets.content[0].text}

SCHEMA:
${schemaText}

EMBEDDINGS: ${embeddings.content[0].text}

ACTIVE RELEASES: ${activeReleasesText}`;

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
