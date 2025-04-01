import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { SanityClient } from "@sanity/client";
import { sanityClient } from "../../config/sanity.js";
import { ListReleaseDocumentsParamsType } from "./schemas.js";
export async function listAllReleases(
  args: ListReleaseDocumentsParamsType,
): Promise<CallToolResult> {
  try {
    let res = await listReleases(sanityClient, args.includeAll);
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
  includeAll: boolean = false,
): Promise<Record<string, string>[]> {
  const query = includeAll
    ? "releases::all()"
    : 'releases::all()[state == "active"]';
  const params = {};

  try {
    let res = await client.fetch(query, params);
    return res;
  } catch (error: unknown) {
    throw error;
  }
}
