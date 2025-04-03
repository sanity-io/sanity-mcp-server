import { customAlphabet } from "nanoid";

export const enum DocumentCategory {
  Drafts = "drafts",
  Versions = "versions",
  Published = "published",
}

const alphabet = "abcdefghijklmnopqrstuvwxyz";

export function generateReleaseId(): string {
  const idGen = customAlphabet(`${alphabet}${alphabet.toUpperCase()}123456789`);
  const id = idGen(8);
  return `r${id}`;
}

// lazy category and id extraction from document id
// assumes sanity always return doc ids of format <category>.<id>
export function parseDocId(docId: string): [DocumentCategory, string] {
  const idParts = docId.split(".");
  if (idParts.length == 1) {
    return [DocumentCategory.Published, docId];
  }

  let category = idParts[0];
  var publishedId: string;
  if (category === DocumentCategory.Versions) {
    publishedId = idParts.pop() ?? "";
  } else {
    publishedId = idParts.slice(1).join(".");
  }

  return [category as DocumentCategory, publishedId];
}

// find the publishedId so any drafts or versions prefixes is removed and the last string is assumed to be the published id
export function parsePublishedId(publishedId: string): string {
  const idParts = publishedId.split(".");
  if (idParts.length === 1) {
    // no versions in id
    return publishedId;
  }

  return idParts.at(-1)!!;
}

export function addDocVersionId(docId: string, versionId: string): string {
  return `versions.${versionId}.${docId}`;
}

export function parseReleaseId(releaseId: string): string {
  const prefix = "_.releases.";
  return releaseId.startsWith(prefix) ? releaseId : `${prefix}${releaseId}`;
}
