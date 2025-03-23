import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../../config/sanity.js";
import type { DeleteMultipleDocumentsParams } from "./schemas.js";

/**
 * Tool for deleting multiple documents from the Sanity dataset using either IDs or a GROQ query
 */
export async function deleteMultipleDocumentsTool(
  args: DeleteMultipleDocumentsParams,
  extra: RequestHandlerExtra
) {
  try {
    const { ids, query, params, options } = args;
    
    // Create the mutation selection based on whether we have IDs or a query
    const selection = ids 
      ? { 
          query: '*[_id in $ids]',
          params: { ids }
        }
      : query 
        ? { query, params }
        : null;
        
    if (!selection) {
      throw new Error("Either ids or query must be provided");
    }
    
    // Delete the documents using the sanity client
    const result = await sanityClient.delete(selection, options || {});
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            operation: "delete_multiple",
            selection,
            options,
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
          text: `Error deleting documents: ${error.message}`,
        },
      ],
    };
  }
} 