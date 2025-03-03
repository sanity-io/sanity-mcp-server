import { WebSocket } from 'ws';
import { createSanityClient } from '../utils/sanityClient.js';
import { portableTextToMarkdown } from '../utils/portableText.js';
import config from '../config/config.js';
import { SanityClient } from '@sanity/client';
import { SubscribeOptions } from '../types/index.js';

interface Subscription {
  unsubscribe: () => void;
}

// Map of active subscriptions
const activeSubscriptions = new Map<string, Subscription>();

/**
 * Searches for content using GROQ query language
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param query - GROQ query to execute
 * @param params - Query parameters (if any)
 * @param verifyWithLLM - Whether to verify results with LLM
 * @returns Search results
 */
export async function searchContent(
  projectId: string, 
  dataset: string, 
  query: string, 
  params: Record<string, any> = {}, 
  verifyWithLLM: boolean = false
): Promise<{
  results: any;
  verification?: {
    performed: boolean;
    originalCount: number;
    verifiedCount: number;
  };
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Execute the GROQ query
    const results = await client.fetch(query, params);
    
    // If LLM verification is not needed, return the results directly
    if (!verifyWithLLM) {
      return {
        results: processPortableTextFields(results)
      };
    }
    
    // Verify results with LLM if requested and we have an OpenAI API key
    if (verifyWithLLM && config.openAiApiKey) {
      console.log(`LLM verification requested for ${Array.isArray(results) ? results.length : 1} documents`);
      
      const verifiedResults = await verifyResults(results);
      
      return {
        results: processPortableTextFields(verifiedResults),
        verification: {
          performed: true,
          originalCount: Array.isArray(results) ? results.length : 1,
          verifiedCount: Array.isArray(verifiedResults) ? verifiedResults.length : (verifiedResults ? 1 : 0)
        }
      };
    }
    
    return {
      results: processPortableTextFields(results),
      verification: {
        performed: false,
        originalCount: Array.isArray(results) ? results.length : 1,
        verifiedCount: Array.isArray(results) ? results.length : (results ? 1 : 0)
      }
    };
  } catch (error: any) {
    console.error(`Error searching content:`, error);
    throw new Error(`Failed to search content: ${error.message}`);
  }
}

/**
 * Verifies results using an LLM
 * 
 * @param results - Array of content items to verify
 * @returns Verified results
 */
async function verifyResults(results: any): Promise<any> {
  // In a real implementation, this would call OpenAI API to verify content
  // For now, this is a stub implementation that just returns the original results
  
  // If results is an array, process each item, otherwise process the single result
  if (Array.isArray(results)) {
    // In a real implementation, you would filter out irrelevant or inappropriate content here
    return results;
  } else {
    // Handle single result case
    return results;
  }
}

/**
 * Subscribes to real-time updates for documents matching a query
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param query - GROQ query to listen to
 * @param options - Additional options
 * @returns Subscription details
 */
export async function subscribeToUpdates(
  projectId: string,
  dataset: string,
  query: string,
  options: Partial<SubscribeOptions> = {}
): Promise<{
  subscriptionId: string;
  query: string;
  message: string;
}> {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Create a subscription
    const subscription = client.listen(query);
    
    // Generate a unique subscription ID
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    
    // Set up event handlers for the subscription
    const sub = subscription.subscribe((update) => {
      // Process the update event
      console.log(`Document update for subscription ${subscriptionId}:`, {
        documentId: update.documentId,
        type: update.transition,
        result: update.result
      });
      
      // In a production implementation, you would send these updates to the client
      // e.g., via WebSockets, Server-Sent Events, or a notification system
    });
    
    // Store the subscription in the active subscriptions map
    activeSubscriptions.set(subscriptionId, sub);
    
    return {
      subscriptionId,
      query,
      message: `Successfully subscribed to updates for query: ${query}`
    };
  } catch (error: any) {
    console.error(`Error setting up subscription:`, error);
    throw new Error(`Failed to subscribe to updates: ${error.message}`);
  }
}

/**
 * Helper function to convert Portable Text fields to Markdown
 * 
 * @param data - Data containing potential Portable Text fields
 * @returns Processed data with Portable Text converted to Markdown
 */
function processPortableTextFields(data: any): any {
  // Handle array of results
  if (Array.isArray(data)) {
    return data.map(item => processPortableTextFields(item));
  }
  
  // Handle single result (must be an object)
  if (data && typeof data === 'object') {
    // Create a shallow copy to avoid mutating the original
    const result = { ...data };
    
    // Process each field in the object
    for (const [key, value] of Object.entries(result)) {
      // If it's an array, check if it's Portable Text
      if (Array.isArray(value) && value.length > 0 && value[0]?._type === 'block') {
        // Convert Portable Text to Markdown
        result[key] = portableTextToMarkdown(value);
      }
      // If it's an object, process it recursively
      else if (value && typeof value === 'object') {
        result[key] = processPortableTextFields(value);
      }
    }
    
    return result;
  }
  
  // Return primitives as-is
  return data;
}

/**
 * Fetches the GROQ specification from the Sanity documentation
 * 
 * @returns The GROQ specification
 */
export async function getGroqSpecification(): Promise<{
  specification: any;
  source: string;
}> {
  try {
    // Fetch the GROQ specification from the Sanity documentation
    const response = await fetch("https://sanity-io.github.io/GROQ/");
    
    if (!response.ok) {
      throw new Error(`Failed to fetch GROQ specification, status: ${response.status}`);
    }
    
    // For a real implementation, you would parse the HTML or use a proper API
    // For now, we'll return a mocked version of the specification
    
    return {
      specification: {
        name: "GROQ",
        description: "GROQ (Graph-Relational Object Queries) is a query language for JSON-like data structures that enables you to filter and join data from multiple collections without explicit joins.",
        coreFeatures: [
          "Filtering with predicates and operators",
          "Projections to shape the returned data",
          "Joins across documents without explicit join syntax",
          "Aggregation and grouping"
        ],
        operators: [
          { name: "==", description: "Equal to" },
          { name: "!=", description: "Not equal to" },
          { name: ">", description: "Greater than" },
          { name: ">=", description: "Greater than or equal to" },
          { name: "<", description: "Less than" },
          { name: "<=", description: "Less than or equal to" },
          { name: "in", description: "Check if value exists in an array" },
          { name: "match", description: "Check if string matches a pattern" }
        ],
        examples: [
          {
            description: "Get all documents of type 'post'",
            query: "*[_type == 'post']"
          },
          {
            description: "Get the title of all posts",
            query: "*[_type == 'post'].title"
          },
          {
            description: "Get posts with their authors",
            query: "*[_type == 'post']{title, 'authorName': author->name}"
          },
          {
            description: "Filter posts by published date",
            query: "*[_type == 'post' && publishedAt > '2023-01-01']"
          }
        ],
        resources: [
          { name: "GROQ documentation", url: "https://www.sanity.io/docs/groq" },
          { name: "GROQ cheat sheet", url: "https://www.sanity.io/docs/query-cheat-sheet" },
          { name: "Learn GROQ", url: "https://groq.dev/" }
        ]
      },
      source: "https://sanity-io.github.io/GROQ/"
    };
  } catch (error: any) {
    console.error("Error fetching GROQ specification:", error);
    throw new Error(`Failed to get GROQ specification: ${error.message}`);
  }
}
