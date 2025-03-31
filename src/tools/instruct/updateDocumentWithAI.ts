import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sanityClient } from "../../config/sanity.js";
import { UpdateDocumentWithAiParams } from "./schemas.js";

export async function updateDocumentWithAi(
    args: UpdateDocumentWithAiParams
): Promise<CallToolResult> {
  try {
    const { documentId, instruction, path, async, schemaId } = args;

    const existingDoc = await sanityClient.getDocument(documentId);

    if (!existingDoc) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    if (!schemaId) {
      throw new Error("Schema ID is required for AI instructions");
    }

    const instructOptions = {
      documentId,
      schemaId,
      instruction,
      path,
    };

    if (async === true) {
      const result = await sanityClient.instruct({
        ...instructOptions,
        async: true,
      });

      return {
        content: [
          {
            type: "text",
            text: `Document is being updated in the background with ID ${result._id}`
          }
        ]
      }
    }

    const result = await sanityClient.instruct(instructOptions);

    return {
      content: [
        {
          type: "text",
          text: `Document updated successfully with ID ${result._id}`
        }
      ]
    }
  } catch (error) {
    return {
    isError: true,
      content: [
        {
          type: "text",
          text: `Error: ${error}`
        }
      ]
    }
  }
}
