import {
  MultipleActionResult,
  SanityClient,
  SingleActionResult,
} from "@sanity/client";
import { actionRequest } from "../documents/actions/actionRequest.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sanityClient } from "../../config/sanity.js";
import { ReleaseActionBodyType, ReleaseParamsType } from "./schema.js";
import { generateReleaseId } from "../utils.js";

export async function createRelease(
  args: ReleaseParamsType,
): Promise<CallToolResult> {
  try {
    await createReleaseAction(sanityClient, args);

    return {
      content: [
        {
          type: "text",
          text: "Successfully created a release",
        },
      ],
    };
  } catch (error: unknown) {
    console.log(error);
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `error creating release: ${error}`,
        },
      ],
    };
  }
}

export async function createReleaseAction(
  client: SanityClient,
  releaseReq: ReleaseParamsType,
): Promise<SingleActionResult | MultipleActionResult> {
  try {
    // TODO: handle id conflict
    const releaseId = generateReleaseId();
    const res = await actionRequest<ReleaseActionBodyType[], any>(client, [
      {
        actionType: "sanity.action.release.create",
        releaseId: releaseId,
        ...releaseReq,
      },
    ]);
    return res;
  } catch (e: unknown) {
    throw e;
  }
}
