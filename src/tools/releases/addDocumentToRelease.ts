import {
  addDocumentRequest,
  createDocumentVersion,
} from "./versions/createDocumentVersion.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ReleaseDocumentParamsType } from "./schema.js";
import { sanityClient } from "../../config/sanity.js";
import { addDocVersionId, DocumentCategory, parseDocId } from "../utils.js";

export async function processDocumentForRelease(
  params: ReleaseDocumentParamsType,
): Promise<addDocumentRequest> {
  let { publishedId, releaseId } = params;
  const doc = await sanityClient.getDocument(publishedId);
  if (doc === undefined) {
    throw Error(`document with publishedId: ${publishedId}, not found`);
  }
  // gets the published id from the document if its in draft we still used the id as drafts.<published_id>
  // if tho its not published yet
  let [category, docReleaseId] = parseDocId(doc._id);
  if (category === DocumentCategory.Versions) {
    // maybe rewrite message
    throw Error("publishedId should not contain release information");
  }

  // adds the versions id to the doc i.e. versions.<releaseId>.<publishedId>
  doc._id = addDocVersionId(docReleaseId, releaseId);
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
