import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";

export async function listSchemaTypesTool(
  args: {},
  extra: RequestHandlerExtra
) {
  try {
    const schemaTypes = await getSchemaTypes();

    return {
      content: [
        {
          type: "text" as const,
          text: schemaTypes.length
            ? `Schema types: ${schemaTypes.join(", ")}`
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
          text: `Error fetching schema types: ${error}`,
        },
      ],
    };
  }
}

export async function getSchemaTypes() {
  try {
    const query = `array::unique(*[]._type)`;
    const types = await sanityClient.fetch(query);

    if (!Array.isArray(types)) {
      throw new Error("Unexpected response format: expected an array.");
    }

    const userTypes = types.filter(
      (type) =>
        typeof type === "string" &&
        !type.startsWith("system.") &&
        !type.startsWith("sanity.")
    );

    return userTypes;
  } catch (error) {
    throw new Error(`Error fetching schema types: ${error}`);
  }
}
