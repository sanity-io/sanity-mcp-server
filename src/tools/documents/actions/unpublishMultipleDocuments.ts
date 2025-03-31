import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sanityClient } from "../../../config/sanity.js";
import { UnpublishAction } from "@sanity/client";
import { PublishDocumentsParamsType } from "./schema.js";

export async function unpublishMultipleDocuments(
  args: PublishDocumentsParamsType,
): Promise<CallToolResult> {
  try {
    let { publishIds } = args;

    let unpublishActions: UnpublishAction[] = publishIds.map((action) => {
      let publishAction: UnpublishAction = {
        actionType: "sanity.action.document.unpublish",
        draftId: action.draftId,
        publishedId: action.publishId,
      };
      return publishAction;
    });

    let res = await sanityClient.action(unpublishActions);

    return {
      content: [
        {
          type: "text",
          text: `Sucessfully published document with transaction id: ${res.transactionId}`,
        },
      ],
    };
  } catch (e: unknown) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `got error: ${e}`,
        },
      ],
    };
  }
}
