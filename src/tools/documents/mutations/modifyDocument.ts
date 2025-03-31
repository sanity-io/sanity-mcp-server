import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../../config/sanity.js";
import { ModifyDocumentParams } from "./schemas.js";

/**
 * Tool for applying a single mutation to a document
 */
export async function modifyDocumentTool(
  args: ModifyDocumentParams,
  extra: RequestHandlerExtra
) {
  try {
    let transaction = sanityClient.transaction();
    
    switch (args.operation) {
      case 'create':
        transaction = transaction.create(args.document);
        break;
      case 'createOrReplace':
        transaction = transaction.createOrReplace(args.document);
        break;
      case 'createIfNotExists':
        transaction = transaction.createIfNotExists(args.document);
        break;
      case 'patch':
        if (!args.patch) {
          throw new Error('Patch operation requires patch data');
        }
        let patch = sanityClient.patch(args.document._id);
        
        if (args.patch.set) patch = patch.set(args.patch.set);
        if (args.patch.setIfMissing) patch = patch.setIfMissing(args.patch.setIfMissing);
        if (args.patch.unset) patch = patch.unset(args.patch.unset);
        if (args.patch.inc) patch = patch.inc(args.patch.inc);
        if (args.patch.dec) patch = patch.dec(args.patch.dec);
        if (args.patch.ifRevisionId) patch = patch.ifRevisionId(args.patch.ifRevisionId);
        
        transaction = transaction.patch(patch);
        break;
      case 'delete':
        transaction = transaction.delete(args.document._id);
        break;
    }

    const result = await transaction.commit(args.options);
    const text = JSON.stringify({
      operation: args.operation,
      document: args.document,
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
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Error executing mutation: ${error.message}`,
        },
      ],
    };
  }
} 