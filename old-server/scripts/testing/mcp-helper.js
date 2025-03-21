/**
 * MCP Tool Invocation Helper
 * 
 * This file provides utility functions for calling MCP tools in a cross-platform compatible way.
 */

/**
 * Detects the current environment (Cursor vs Claude Desktop)
 * @returns {string} The detected environment ('cursor', 'claude_desktop', or 'unknown')
 */
export function detectEnvironment() {
  // This is a simplified detection mechanism
  // In a real implementation, you might check for specific environment variables or APIs
  if (typeof window !== 'undefined' && window.cursor) {
    return 'cursor';
  } else if (typeof window !== 'undefined' && window.claude) {
    return 'claude_desktop';
  }
  
  // Default to standard pattern if environment can't be determined
  return 'unknown';
}

/**
 * Creates a compatible MCP tool invocation string 
 * @param {string} toolName - The name of the tool to invoke
 * @param {string} serverName - The name of the server providing the tool
 * @param {Object} params - The parameters to pass to the tool
 * @returns {string} A formatted tool invocation string
 */
export function createToolInvocation(toolName, serverName, params = {}) {
  const env = detectEnvironment();
  
  if (env === 'cursor') {
    return `mcp__${toolName}(${JSON.stringify(params)})`;
  } else {
    // Claude Desktop or unknown environment - use the standard pattern
    return `mcp__${serverName}__${toolName}(${JSON.stringify(params)})`;
  }
}

/**
 * Recommended helper for invoking MCP tools in a cross-platform compatible way
 * @param {string} toolName - The name of the tool to invoke
 * @param {string} serverName - The name of the server providing the tool
 * @param {Object} params - The parameters to pass to the tool
 * @returns {Promise<any>} The result of the tool invocation
 */
export async function invokeMcpTool(toolName, serverName, params = {}) {
  const env = detectEnvironment();
  
  if (env === 'cursor') {
    // In Cursor, we can directly use the pattern without server name
    const toolFunction = window[`mcp__${toolName}`];
    if (typeof toolFunction === 'function') {
      return await toolFunction(params);
    }
  } else {
    // In Claude Desktop or unknown environments, use the standard pattern
    const toolFunction = window[`mcp__${serverName}__${toolName}`];
    if (typeof toolFunction === 'function') {
      return await toolFunction(params);
    }
  }
  
  throw new Error(`Could not invoke MCP tool ${toolName} from server ${serverName}`);
}

/**
 * Example usage:
 * 
 * // Using the helper function
 * const result = await invokeMcpTool('echo', 'minimal', { message: 'Hello World' });
 * 
 * // This will call mcp__echo in Cursor or mcp__minimal__echo in Claude Desktop
 */ 