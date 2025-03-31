import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sanityClient } from "../../../config/sanity.js";
import { PublishAction } from "@sanity/client";
import { PublishDocumentsParamsType } from "./schema.js";

export async function publishMultipleDocuments(
  args: PublishDocumentsParamsType,
): Promise<CallToolResult> {
  try {
    let { publishIds } = args;

    let publishActions: PublishAction[] = publishIds.map((action) => {
      let publishAction: PublishAction = {
        actionType: "sanity.action.document.publish",
        draftId: action.draftId,
        publishedId: action.publishId,
      };
      return publishAction;
    });

    let res = await sanityClient.action(publishActions);

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
