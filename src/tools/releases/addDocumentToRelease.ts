import {
  addDocumentRequest,
  createDocumentVersion,
} from "./versions/createDocumentVersion.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ReleaseDocumentParamsType } from "./schemas.js";
import { sanityClient } from "../../config/sanity.js";
import { addDocVersionId, DocumentCategory, parseDocId } from "../utils.js";

function parseReleaseId(releaseId: string): string {
  const res = releaseId.split(".");
  if (res.length == 1) {
    return releaseId;
  }
  return res.at(-1)!!;
}

export async function processDocumentForRelease(
  params: ReleaseDocumentParamsType,
): Promise<addDocumentRequest> {
  let { publishedId, releaseId } = params;
  var doc = await sanityClient.getDocument(publishedId);
  if (doc === undefined) {
    // check for a draft version if no published version is found
    doc = await sanityClient.getDocument(`drafts.${publishedId}`);
    if (doc === undefined) {
      throw Error(`document with publishedId: ${publishedId}, not found`);
    }
  }
  // gets the published id from the document if its in draft we still used the id as drafts.<published_id>
  // if tho its not published yet
  let [category, docReleaseId] = parseDocId(doc._id);
  if (category === DocumentCategory.Versions) {
    // maybe rewrite message
    throw Error("publishedId should not contain release information");
  }

  const parsedReleaseId = parseReleaseId(releaseId);

  // adds the versions id to the doc i.e. versions.<releaseId>.<publishedId>
  doc._id = addDocVersionId(docReleaseId, parsedReleaseId);
  return {
    actionType: "sanity.action.document.version.create",
    publishedId: docReleaseId,
    document: doc,
  };
}

export async function addDocumentToRelease(
  args: ReleaseDocumentParamsType,
): Promise<CallToolResult> {
  try {
    const processedRequest = await processDocumentForRelease(args);
    await createDocumentVersion(sanityClient, processedRequest);
    return {
      content: [
        {
          type: "text",
          text: `Successfully added document ${processedRequest.document._id} to release`,
        },
      ],
    };
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `error adding document to release: ${error}`,
        },
      ],
    };
  }
}
