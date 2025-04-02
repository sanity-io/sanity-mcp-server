import { RawRequestOptions, SanityClient } from "@sanity/client";

type ActionVersionReplace = "sanity.action.document.version.replace";

interface VersionCreateAction extends ReplaceVersionDocument {
  actionType: ActionVersionReplace;
}

interface ReplaceVersionDocument {
  document: Document;
}

interface Document {
  _id: string;
  _type: string;
}

// not a tool exposed to the model yet, but the request logic works so
// it can easily added as a tool
export async function replaceDocumentVersion(
  client: SanityClient,
  createReq: ReplaceVersionDocument,
) {
  let action: VersionCreateAction = {
    actionType: "sanity.action.document.version.replace",
    ...createReq,
  };

  const dataset = client.config().dataset;

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
