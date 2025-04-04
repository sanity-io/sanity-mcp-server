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
  const schemaString: string = await sanityClient.fetch(
    "*[_id == $schemaId][0].schema",
    {
      schemaId: schemaId ?? "sanity.workspace.schema.default",
    },
  );

  let schema = JSON.parse(schemaString) as ManifestSchemaType[];

  schema = schema.filter((documentOrObject) =>
    ["sanity.", "assist."].every(
      (prefix) => !documentOrObject.type.startsWith(prefix),
    ),
  );

  // If a specific type name is provided, filter the schema to only include that type
  if (typeName) {
    const typeSchema = schema.filter((type) => type.name === typeName);
    if (typeSchema.length === 0) {
      throw new Error(`Type "${typeName}" not found in schema`);
    }
    schema = typeSchema;
  }

  return generateSchemaOverview(schema, { lite });
}
