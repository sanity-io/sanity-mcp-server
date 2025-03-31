import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sanityClient } from "../../../config/sanity.js";
import { GetDocumentsParamsType } from "./schema.js";

export async function getDocumentsByIds(
  args: GetDocumentsParamsType,
): Promise<CallToolResult> {
  try {
    let { documentIds } = args;

    let res = await sanityClient.getDocuments(documentIds);

    if (res === null) {
      return {
        content: [{ type: "text", text: "documents not found" }],
      };
    }

    let text = JSON.stringify(res);

    return {
      content: [{ type: "text", text: text }],
    };
  } catch (e: unknown) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `got error  ${e}`,
        },
      ],
    };
  }
}
