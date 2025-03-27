import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";
import { SemanticSearchParamsType } from "./schema.js";

export async function semanticSearchTool(
  args: SemanticSearchParamsType,
  extra: RequestHandlerExtra
) {
  try {
    const config = sanityClient.config();
    const apiHost = config.apiHost.replace("https://", "");
    const embeddingsEndpoint = `https://${config.projectId}.${apiHost}/vX/embeddings-index/query/${config.dataset}/${args.indexName}`;
    const response = await fetch(embeddingsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: args.query,
        maxResults: args.maxResults || 10,
        filter: args.filter || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    function formatSearchResults(results: any[]) {
      if (results.length === 0) {
        return "No results found";
      }

      return results
        .map((item, index) => {
          const score = (item.score * 100).toFixed(1);
          return `${index + 1}. ${item.value.type} (ID: ${
            item.value.documentId
          })
   Relevance: ${score}%`;
        })
        .join("\n\n");
    }

    const outputText = formatSearchResults(result);
    return {
      content: [
        {
          type: "text" as const,
          text: `Semantic Search Results:\n\n${outputText}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error fetching embeddings indices: ${error}`,
        },
      ],
    };
  }
}
