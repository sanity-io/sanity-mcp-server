import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { z } from "zod";
import { sanityClient } from "../../config/sanity.js";
import type { ExecuteGroqQuerySchema } from "./schemas.js";

type ExecuteGroqQueryParams = z.infer<typeof ExecuteGroqQuerySchema>;

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

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error: any) {
    // Handle errors gracefully
    return {
      content: [
        {
          type: "text" as const,
          text: `Error executing GROQ query: ${error.message}\n\nQuery: ${args.query}`,
        },
      ],
    };
  }
} 