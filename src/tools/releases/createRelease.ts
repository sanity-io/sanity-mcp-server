import {
  MultipleActionResult,
  SanityClient,
  SingleActionResult,
} from "@sanity/client";
import { actionRequest } from "../documents/actions/actionRequest.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sanityClient } from "../../config/sanity.js";
import { ReleaseActionBodyType, ReleaseParamsType } from "./schema.js";

export async function createRelease(
  args: ReleaseParamsType,
): Promise<CallToolResult> {
  try {
    await actionRequest<ReleaseActionBodyType[], any>(sanityClient, [
      {
        actionType: "sanity.action.release.create",
        ...args,
      },
    ]);

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
  releaseReq: ReleaseActionBodyType,
): Promise<SingleActionResult | MultipleActionResult> {
  try {
    const res = await actionRequest<ReleaseActionBodyType, SingleActionResult>(
      client,
      releaseReq,
    );
    return res;
  } catch (e: unknown) {
    throw e;
  }
}
