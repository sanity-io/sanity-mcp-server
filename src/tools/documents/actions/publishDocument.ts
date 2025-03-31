import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sanityClient } from "../../../config/sanity.js";
import { PublishAction } from "@sanity/client";
import { PublishDocumentParamsType } from "./schema.js";

export async function publishDocument(
  args: PublishDocumentParamsType,
): Promise<CallToolResult> {
  try {
    let { draftId, publishId } = args;

    let publishAction: PublishAction = {
      actionType: "sanity.action.document.publish",
      draftId: draftId,
      publishedId: publishId,
    };

    let res = await sanityClient.action(publishAction);

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
