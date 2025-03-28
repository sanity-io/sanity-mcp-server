import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../../config/sanity.js";
import type { CreateMultipleDocumentsParams } from "./schemas.js";

/**
 * Tool for creating multiple documents in the Sanity dataset
 */
export async function createMultipleDocumentsTool(
  args: CreateMultipleDocumentsParams,
  extra: RequestHandlerExtra
) {
  try {
    const { documents, options } = args;
    
    // Create a transaction for all documents
    const transaction = sanityClient.transaction();
    
    // Add each document creation to the transaction
    documents.forEach(doc => {
      transaction.create(doc);
    });
    
    // Commit the transaction with the provided options
    const result = await transaction.commit(options || {});
    const text = JSON.stringify({
      operation: "create_multiple",
      documentsCount: documents.length,
      options,
      result
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
          text: `Error creating documents: ${error.message}`,
        },
      ],
    };
  }
} 