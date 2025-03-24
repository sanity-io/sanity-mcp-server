import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../../config/sanity.js";
import { PatchDocumentParams } from "./schemas.js";

/**
 * Tool for updating an existing document in the Sanity dataset
 */
export async function patchDocumentTool(
  args: PatchDocumentParams,
  extra: RequestHandlerExtra
) {
  try {
    const { id, patch } = args;
    
    // Create a patch builder
    let patchBuilder = sanityClient.patch(id);
    
    // Apply each patch operation that is present
    if (patch.set) {
      patchBuilder = patchBuilder.set(patch.set);
    }
    
    if (patch.setIfMissing) {
      patchBuilder = patchBuilder.setIfMissing(patch.setIfMissing);
    }
    
    if (patch.unset) {
      patchBuilder = patchBuilder.unset(patch.unset);
    }
    
    if (patch.inc) {
      patchBuilder = patchBuilder.inc(patch.inc);
    }
    
    if (patch.dec) {
      patchBuilder = patchBuilder.dec(patch.dec);
    }
    
    // Apply revision check if specified
    if (patch.ifRevisionId) {
      patchBuilder = patchBuilder.ifRevisionId(patch.ifRevisionId);
    }
    
    // Commit the patch
    const result = await patchBuilder.commit();
    const text = JSON.stringify({
      operation: "update",
      documentId: id,
      appliedPatch: patch,
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
          text: `Error updating document: ${error.message}`,
        },
      ],
    };
  }
} 