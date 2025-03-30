import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../../config/sanity.js";
import { CreateDocumentParams } from "./schemas.js";


/**
 * Tool for creating a new document in the Sanity dataset
 */
export async function createDocumentTool(
  args: CreateDocumentParams,
  extra: RequestHandlerExtra
) {
  try {
    const { document } = args;
    
    // Create the document using the sanity client
    const result = await sanityClient.create(document, { autoGenerateArrayKeys: true });
    const text = JSON.stringify({
      operation: "create",
      document: result
    }, null, 2);
    
    return {
      content: [
        {
          type: "text" as const,
          text: text,
        },
      ],
    };
  } catch (error: any) {
    // Handle errors gracefully
    return {
      content: [
        {
          type: "text" as const,
          text: `Error creating document: ${error.message}`,
        },
      ],
    };
  }
} 