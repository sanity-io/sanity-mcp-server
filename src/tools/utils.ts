export const enum DocumentCategory {
  Drafts = "drafts",
  Versions = "versions",
  Published = "published",
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

export function addDocVersionId(docId: string, versionId: string): string {
  return `versions.${versionId}.${docId}`;
}
