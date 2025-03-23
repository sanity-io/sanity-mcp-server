import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../../config/sanity.js";
import { DeleteDocumentParams } from "./schemas.js";

/**
 * Tool for deleting a document from the Sanity dataset using its ID
 */
export async function deleteDocumentTool(
  args: DeleteDocumentParams,
  extra: RequestHandlerExtra
) {
  try {
    const { id } = args;
    
    // Delete the document using the sanity client with just the ID
    const result = await sanityClient.delete(id);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            operation: "delete",
            documentId: id,
            result
          }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    // Handle errors gracefully
    return {
      content: [
        {
          type: "text" as const,
          text: `Error deleting document: ${error.message}`,
        },
      ],
    };
  }
} 