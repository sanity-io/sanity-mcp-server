import { RawRequestOptions, SanityClient } from "@sanity/client";
import { sanityClient } from "../../../config/sanity.js";

type ActionVersionDiscard = "sanity.action.document.version.discard";

interface VersionDiscardAction extends DiscardVersionDocument {
  actionType: ActionVersionDiscard;
}

interface DiscardVersionDocument {
  versionId: string;
  purge?: boolean;
}

// not a tool exposed to the model yet, but the request logic works so
// it can easily added as a tool
export async function discardDocumentVersion(
  client: SanityClient,
  createReq: DiscardVersionDocument,
) {
  let action: VersionDiscardAction = {
    actionType: "sanity.action.document.version.discard",
    ...createReq,
  };

  const dataset = sanityClient.config().dataset;

  const options: RawRequestOptions = {
    uri: `/data/actions/${dataset}`,
    body: { actions: [action] },
  };

  try {
    await client.request(options);
  } catch (e: unknown) {
    throw e;
  }
}
