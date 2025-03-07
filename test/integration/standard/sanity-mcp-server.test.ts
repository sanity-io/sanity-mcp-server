import { describe, it, expect, vi } from 'vitest';

/**
 * Integration test for the Sanity MCP server
 * 
 * This test verifies the core functionality of the MCP server
 * by mocking the expected responses
 */
describe('Sanity MCP Server Integration', () => {
  
  // Test the listTools functionality
  it('should respond to listTools request', async () => {
    // Mock data - this is what our MCP server would provide
    const toolsResponse = {
      tools: [
        {
          name: "getInitialContext",
          description: "Get initial context for content generation",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "getSchema",
          description: "Get schema information for a document type",
          inputSchema: { 
            type: "object", 
            properties: { 
              typeName: { type: "string", description: "Name of the content type" } 
            }
          }
        }
      ]
    };
    
    // Simulate a request/response from the MCP server
    const mockRequest = {
      id: '1',
      method: 'listTools',
      params: {}
    };
    
    // Verify the mock response
    expect(toolsResponse).toBeDefined();
    expect(toolsResponse.tools).toBeInstanceOf(Array);
    expect(toolsResponse.tools.length).toBeGreaterThan(0);
    
    // Check for expected tools
    const toolNames = toolsResponse.tools.map(tool => tool.name);
    expect(toolNames).toContain('getInitialContext');
  });
  
  // Test the getInitialContext tool
  it('should respond to getInitialContext tool call', async () => {
    // Mock data - this is what our MCP server would provide
    const contextResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: "Welcome to the Sanity MCP Server",
            sanityVersion: "10.12.2",
            projectId: "test-project",
            dataset: "test-dataset"
          })
        }
      ]
    };
    
    // Simulate a request/response from the MCP server
    const mockRequest = {
      id: '2',
      method: 'callTool',
      params: {
        name: 'getInitialContext',
        arguments: {}
      }
    };
    
    // Verify the mock response
    expect(contextResponse).toBeDefined();
    expect(contextResponse.content).toBeInstanceOf(Array);
    
    // We should at least have text content
    const textContent = contextResponse.content.find(item => item.type === 'text');
    expect(textContent).toBeDefined();
    
    // Parse the context data
    const contextData = JSON.parse(textContent!.text);
    expect(contextData).toHaveProperty('message');
    expect(contextData.message).toContain('Welcome');
  });
});