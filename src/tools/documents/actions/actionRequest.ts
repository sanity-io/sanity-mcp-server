import { RawRequestOptions, SanityClient } from "@sanity/client";
import { env } from "../../../config/env.js";

export type ActionVersionDiscard = "sanity.action.document.version.discard";
export type ActionVersionCreate = "sanity.action.document.version.create";
export type ActionVersionReplace = "sanity.action.document.version.replace";
export type ActionVersionUnpublish = "sanity.action.document.version.unpublish";
export type ActionReleaseCreate = "sanity.action.release.create";
export type ActionDocumentVersionCreate =
  "sanity.action.document.version.create";
export type ActionDocumentVersionUnpublish =
  "sanity.action.document.version.unpublish";

export type ActionTypes = {
  actionType:
    | ActionVersionCreate
    | ActionVersionReplace
    | ActionVersionUnpublish
    | ActionVersionDiscard
    | ActionReleaseCreate
    | ActionDocumentVersionCreate
    | ActionDocumentVersionUnpublish;
};

// want type T extends ActionTypes but needs some iteration to work with both T[] extends ActionTypes
// so this will only use a generic and its up to the caller to pass the correct request
export async function actionRequest<T, K>(
  client: SanityClient,
  req: T,
): Promise<K> {
  let dataset = env.data!!.SANITY_DATASET;

  let options: RawRequestOptions = {
    uri: `/data/actions/${dataset}`,
    body: { actions: req },
  };

  try {
    let res = await client.request(options);
    return res as K;
  } catch (e: unknown) {
    throw e;
  }
}
