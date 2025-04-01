import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  SanityClient
} from "@sanity/client";
import { sanityClient } from "../../config/sanity.js";
import { actionRequest } from "../documents/actions/actionRequest.js";
import { generateReleaseId } from "../utils.js";
import { ReleaseActionBodyType, ReleaseParamsType } from "./schema.js";

export async function createRelease(
  args: ReleaseParamsType,
): Promise<CallToolResult> {
  try {
    const releaseId = await createReleaseAction(sanityClient, args);

    return {
      content: [
        {
          type: "text",
          text: `Successfully created a release with releaseId ${releaseId}`,
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
): Promise<String> {
  try {
    // TODO: handle id conflict
    const releaseId = generateReleaseId();
    await actionRequest<ReleaseActionBodyType[], any>(client, [
      {
        actionType: "sanity.action.release.create",
        releaseId: releaseId,
        ...releaseReq,
      },
    ]);
    return releaseId;
  } catch (e: unknown) {
    throw e;
  }
}
