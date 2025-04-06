import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";
import { generateSchemaOverview } from "./generateSchemaOverview.js";
import { ManifestSchemaType } from "./schema.js";
import { toJsonString } from "./toJson.js";

export async function getSchemaOverviewTool(
  args: {},
  extra: RequestHandlerExtra,
) {
  try {
    const schemaTypes = await getSchemaOverview({});

    return {
      content: [
        {
          type: "text" as const,
          text:
            schemaTypes.schemaOverview.totalTypes > 0
              ? `Schema type overview: \n${toJsonString(
                  schemaTypes.schemaOverview,
                )}`
              : "No types found in the current schema.",
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Error fetching schema overview: ${error}`,
        },
      ],
    };
  }
}

type GetSchemaOverviewParams = {
  /**
   * The schema ID to fetch. Defaults to "sanity.workspace.schema", which is the default.
   */
  schemaId?: string;
  /**
   * The type name to filter the schema by.
   */
  typeName?: string;
  /**
   * If true, only include the schema overview without details about the fields
   */
  lite?: boolean;
};

export async function getSchemaOverview({
  schemaId,
  typeName,
  lite,
}: GetSchemaOverviewParams) {
  // First get all unique types from the content
  const query = `array::unique(*[]._type)`;
  const types = await sanityClient.fetch(query);

  if (!Array.isArray(types)) {
    throw new Error("Unexpected response format when getting schema overview: expected an array of types but got " + JSON.stringify(types));
  }

  // Filter out system types
  const userTypes = types.filter(
    (type) =>
      typeof type === "string" &&
      !type.startsWith("system.") &&
      !type.startsWith("sanity.") &&
      !type.startsWith("assist.")
  );

  // Convert types to schema format
  let schema = userTypes.map((type) => ({
    name: type,
    type: type,
    fields: [], // We don't need fields for overview
  })) as ManifestSchemaType[];

  // If a specific type name is provided, filter the schema to only include that type
  if (typeName) {
    const typeSchema = schema.filter((type) => type.name === typeName);
    if (typeSchema.length === 0) {
      throw new Error(`Type "${typeName}" not found in schema`);
    }
    schema = typeSchema;
  }

  return generateSchemaOverview(schema, { lite: true }); // Always use lite since we're not fetching fields
}
