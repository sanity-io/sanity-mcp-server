import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";
import { generateSchemaOverview } from "./generateSchemaOverview.js";
import { ManifestSchemaType } from "./schema.js";
import { toJsonString } from "./toJson.js";

export async function getSchemaOverviewTool(
  args: {},
  extra: RequestHandlerExtra
) {
  try {
    const schemaTypes = await getSchemaOverview({});

    return {
      content: [
        {
          type: "text" as const,
          text:
            schemaTypes.sanitySchema.schemaOverview.totalTypes > 0
              ? `Schema type overview: \n${toJsonString(
                  schemaTypes.sanitySchema.schemaOverview
                )}`
              : "No custom schema types found.",
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
};
export async function getSchemaOverview({
  schemaId,
  typeName,
}: GetSchemaOverviewParams) {
  const schemaString: string = await sanityClient.fetch(
    "*[_id == $schemaId][0].schema",
    { schemaId: schemaId ?? "sanity.workspace.schema" }
  );

  let schema = JSON.parse(schemaString) as ManifestSchemaType[];

  schema = schema.filter(
    (documentOrObject) => !documentOrObject.type.startsWith("sanity.")
  );

  // If a specific type name is provided, filter the schema to only include that type
  if (typeName) {
    const typeSchema = schema.filter((type) => type.name === typeName);
    if (typeSchema.length === 0) {
      throw new Error(`Type "${typeName}" not found in schema`);
    }
    schema = typeSchema;
  }

  return generateSchemaOverview(schema);
}
