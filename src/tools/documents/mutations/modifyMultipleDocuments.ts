import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../../config/sanity.js";
import { ModifyMultipleDocumentsParams } from "./schemas.js";

/**
 * Tool for applying multiple mutations to documents in a single transaction
 */
export async function modifyMultipleDocumentsTool(
  args: ModifyMultipleDocumentsParams,
  extra: RequestHandlerExtra
) {
  try {
    // Start a new transaction
    let transaction = sanityClient.transaction();

    // Add each mutation to the transaction
    for (const mutation of args.mutations) {
      switch (mutation.operation) {
        case 'create':
          transaction = transaction.create(mutation.document);
          break;
        case 'createOrReplace':
          transaction = transaction.createOrReplace(mutation.document);
          break;
        case 'createIfNotExists':
          transaction = transaction.createIfNotExists(mutation.document);
          break;
        case 'patch':
          if (!mutation.patch) {
            throw new Error('Patch operation requires patch data');
          }
          let patch = sanityClient.patch(mutation.document._id);
          
          if (mutation.patch.set) {
            patch = patch.set(mutation.patch.set);
          }
          if (mutation.patch.setIfMissing) {
            patch = patch.setIfMissing(mutation.patch.setIfMissing);
          }
          if (mutation.patch.unset) {
            patch = patch.unset(mutation.patch.unset);
          }
          if (mutation.patch.inc) {
            patch = patch.inc(mutation.patch.inc);
          }
          if (mutation.patch.dec) {
            patch = patch.dec(mutation.patch.dec);
          }
          if (mutation.patch.ifRevisionId) {
            patch = patch.ifRevisionId(mutation.patch.ifRevisionId);
          }
          
          transaction = transaction.patch(patch);
          break;
        case 'delete':
          transaction = transaction.delete(mutation.document._id);
          break;
      }
    }

    // Commit the transaction
    const result = await transaction.commit();
    const text = JSON.stringify({
      operation: "transaction",
      mutations: args.mutations,
      results: result
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
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Error executing transaction: ${error.message}`,
        },
      ],
    };
  }
} 