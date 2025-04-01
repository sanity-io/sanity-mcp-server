import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";
import { GetSchemaParams, GetSchemaParamsType } from "./schema.js";
export async function getTypeSchemaTool(
  args: GetSchemaParamsType,
  extra: RequestHandlerExtra
) {
  try {
    const formattedFields = await getSchema(args.type);

    return {
      content: [
        {
          type: "text" as const,
          text: `Schema for type ${args.type}:\n${formattedFields}`,
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Error fetching schema for type ${args.type}: ${error}`,
        },
      ],
    };
  }
}

export async function getSchema(type: string) {
  try {
    const query = `*[_type == $type][0] { ..., _id }`;
    const schemaFields = await sanityClient.fetch(query, { type: type });

    if (!schemaFields) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No schema found for type ${type}.`,
          },
        ],
      };
    }

    const getType = (value: any): string => {
      if (Array.isArray(value)) return "array";
      if (value === null) return "null";
      return typeof value;
    };

    const formattedFields = Object.entries(schemaFields)
      .map(([field, value]) => `${field}: ${getType(value)}`)
      .join("\n");

    return formattedFields;
  } catch (error) {
    throw new Error(`Error fetching schema for type ${type}: ${error}`);
  }
}
