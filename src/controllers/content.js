import { WebSocket } from 'ws';
import { createSanityClient } from '../utils/sanityClient.js';
import { portableTextToMarkdown } from '../utils/portableText.js';
import config from '../config/config.js';

// Map of active subscriptions
const activeSubscriptions = new Map();

/**
 * Searches for content using GROQ query language
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name
 * @param {string} query - GROQ query to execute
 * @param {Object} params - Query parameters (if any)
 * @param {boolean} verifyWithLLM - Whether to verify results with LLM
 * @returns {Promise<Object>} Search results
 */
export async function searchContent(projectId, dataset, query, params = {}, verifyWithLLM = false) {
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
    
    // Otherwise, filter results with LLM
    const verifiedResults = await verifyResults(results);
    
    return {
      results: processPortableTextFields(verifiedResults),
      verification: {
        performed: true,
        originalCount: results.length,
        verifiedCount: verifiedResults.length
      }
    };
  } catch (error) {
    console.error(`Error searching content:`, error);
    throw new Error(`Failed to search content: ${error.message}`);
  }
}

/**
 * Verifies results using an LLM
 * 
 * @param {Array} results - Array of content items to verify
 * @returns {Promise<Array>} Verified results
 */
async function verifyResults(results) {
  // Check if we have API key configured
  if (!config.openAiApiKey) {
    throw new Error('LLM verification requested but OpenAI API key not configured');
  }
  
  // This is a placeholder - in a real implementation, you would:
  // 1. Call an LLM API (like OpenAI)
  // 2. Check each document against criteria
  // 3. Return only those that match
  
  console.log(`LLM verification requested for ${results.length} documents`);
  
  // For demonstration, just return the results (implement real verification as needed)
  return results;
}

/**
 * Subscribes to real-time updates for documents matching a query
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name
 * @param {string} query - GROQ query defining which documents to watch
 * @returns {Promise<Object>} Subscription details
 */
export async function subscribeToUpdates(projectId, dataset, query) {
  try {
    const client = createSanityClient(projectId, dataset);
    
    // Generate a unique subscription ID
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Set up the subscription
    const subscription = client.listen(query)
      .subscribe(update => {
        // This is where you would send the update to the client
        // In a real MCP server, you might use a callback or websocket
        console.log(`Document update for subscription ${subscriptionId}:`, update);
        
        // Here we're just logging, but you would notify the AI
        // via your MCP implementation's push notification mechanism
      });
    
    // Store the subscription for later cleanup
    activeSubscriptions.set(subscriptionId, subscription);
    
    // Return subscription details
    return {
      subscriptionId,
      query,
      message: 'Subscription active - updates will be pushed via MCP notifications'
    };
  } catch (error) {
    console.error(`Error setting up subscription:`, error);
    throw new Error(`Failed to subscribe to updates: ${error.message}`);
  }
}

/**
 * Helper function to convert Portable Text fields to Markdown
 * 
 * @param {Object|Array} data - Data containing potential Portable Text fields
 * @returns {Object|Array} Processed data with Portable Text converted to Markdown
 */
function processPortableTextFields(data) {
  if (Array.isArray(data)) {
    return data.map(item => processPortableTextFields(item));
  }
  
  if (data && typeof data === 'object') {
    const processed = { ...data };
    
    Object.entries(processed).forEach(([key, value]) => {
      // Check if the value is a Portable Text array
      if (Array.isArray(value) && value.length > 0 && value[0]._type === 'block') {
        // Convert to Markdown
        processed[key] = {
          _type: 'portableText',
          _markdown: portableTextToMarkdown(value),
          _original: value
        };
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processed[key] = processPortableTextFields(value);
      }
    });
    
    return processed;
  }
  
  return data;
}
