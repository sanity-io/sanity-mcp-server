import { SanityClient } from "@sanity/client";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sanityClient } from "../../config/sanity.js";

export async function listAllReleases(): Promise<CallToolResult> {
  try {
    let res = await listReleases(sanityClient);
    if (!res) {
      return {
        content: [
          {
            type: "text",
            text: `Could not find any releases`,
          },
        ],
      };
    }

    let releases = JSON.stringify(res);

    return {
      content: [
        {
          type: "text",
          text: releases,
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
export async function listReleases(
  client: SanityClient,
): Promise<Record<string, string>[]> {
  const query = "releases::all()";
  const params = {};

  try {
    let res = await client.fetch(query, params);
    return res;
  } catch (error: unknown) {
    throw error;
  }
}
