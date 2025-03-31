import { nanoid } from "nanoid";
import { DocumentLike } from "../types/documents.js";

export const enum DocumentCategory {
  Drafts = "drafts",
  Versions = "versions",
  Published = "published",
}

export function generateReleaseId(): string {
  const id = nanoid(8);
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

export function addDocVersionId(docId: string, versionId: string): string {
  return `versions.${versionId}.${docId}`;
}


/**
 * Strips the document for LLM output to avoid returning overly large documents.
 *
 * @param {object} document - The document to strip.
 * @returns {object} The truncated document.
 */
export const truncateDocumentForLLMOutput = (
  document: DocumentLike,
): DocumentLike => {
  if (!document) return document;

  const strippedDoc = { ...document };

  // Process all keys in the document
  for (const key of Object.keys(strippedDoc)) {
    const value = strippedDoc[key];

    // Handle long strings by truncating them
    if (typeof value === "string" && value.length > 160) {
      strippedDoc[key] = `${value.slice(0, 160)}...`;
    }

    // Keep only the first item in arrays to save space
    if (Array.isArray(value)) {
      strippedDoc[key] =
        value.length > 0
          ? [value[0], `+ ${value.length - 1} more array items`]
          : [];
    }
  }

  return strippedDoc;
};
