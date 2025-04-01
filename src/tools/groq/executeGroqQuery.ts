import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";
import { ExecuteGroqQueryParams } from "./schemas.js";

/**
 * Tool for executing arbitrary GROQ queries against the Sanity dataset
 */
export async function executeGroqQueryTool(
  args: ExecuteGroqQueryParams,
  extra: RequestHandlerExtra
) {
  try {
    const { query, params } = args;
    
    // Execute the query using the sanity client
    const result = await sanityClient.fetch(query, params);
    
    // Format the response
    const response = {
      query,
      params: params || {},
      result,
      resultCount: Array.isArray(result) ? result.length : 1
    };

    const responseText = JSON.stringify(response, null, 2);

    return {
      content: [
        {
          type: "text" as const,
          text: responseText,
        },
      ],
    };
  } catch (error: any) {
    // Handle errors gracefully
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Error executing GROQ query: ${error.message}\n\nQuery: ${args.query}`,
        },
      ],
    };
  }
} 