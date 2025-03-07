import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { setTimeout } from 'timers/promises';

/**
 * Integration test for the Sanity MCP server
 * 
 * This test spawns the actual Sanity MCP server as a child process,
 * sends commands to it via stdin, and verifies the responses from stdout
 */
describe('Sanity MCP Server Integration', () => {
  let serverProcess: any;
  let stdoutData = '';
  let serverReady = false;

  // Start the server before tests
  beforeAll(async () => {
    const serverPath = resolve(process.cwd(), 'dist/index.js');
    
    // Make sure the server is built
    try {
      await new Promise<void>((resolve, reject) => {
        const buildProcess = spawn('npm', ['run', 'build'], {
          stdio: 'inherit'
        });
        
        buildProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Build process exited with code ${code}`));
          }
        });
      });
    } catch (error) {
      console.error('Failed to build server:', error);
      throw error;
    }
    
    // Environment variables needed for the server
    const env = {
      ...process.env,
      SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID || 'test-project',
      SANITY_DATASET: process.env.SANITY_DATASET || 'test-dataset',
      SANITY_TOKEN: process.env.SANITY_TOKEN || 'test-token',
      NODE_ENV: 'test'
    };
    
    serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env
    });
    
    // Collect stdout data
    serverProcess.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdoutData += text;
      
      // Check if server is ready
      if (text.includes('connected') || text.includes('started')) {
        serverReady = true;
      }
    });
    
    // Log stderr for debugging
    serverProcess.stderr.on('data', (data: Buffer) => {
      console.error('Server stderr:', data.toString());
    });
    
    // Wait for server to be ready (up to 5 seconds)
    for (let i = 0; i < 50; i++) {
      if (serverReady) break;
      await setTimeout(100);
    }
    
    // Even if we don't get an explicit ready message, wait a bit to ensure the server has started
    if (!serverReady) {
      await setTimeout(1000);
      serverReady = true;
    }
    
    // Clear stdout data collected during startup
    stdoutData = '';
  });
  
  // Cleanup after tests
  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });
  
  // Test the listTools functionality
  it('should respond to listTools request', async () => {
    // Prepare MCP request for listing tools
    const request = {
      id: '1',
      method: 'listTools',
      params: {}
    };
    
    // Send the request to the server
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // Wait for response
    let responseReceived = false;
    let maxAttempts = 50;
    let response;
    
    while (!responseReceived && maxAttempts > 0) {
      await setTimeout(100);
      maxAttempts--;
      
      const match = stdoutData.match(/\{[\s\S]*"tools"[\s\S]*\}/);
      if (match) {
        try {
          response = JSON.parse(match[0]);
          responseReceived = true;
        } catch (e) {
          // Not a complete JSON object yet
        }
      }
    }
    
    // Assert the response is correct
    expect(responseReceived).toBe(true);
    expect(response).toBeDefined();
    expect(response.tools).toBeInstanceOf(Array);
    expect(response.tools.length).toBeGreaterThan(0);
    
    // Check for some expected tools
    const toolNames = response.tools.map((tool: any) => tool.name);
    expect(toolNames).toContain('getInitialContext');
  });
  
  // Test the getInitialContext tool
  it('should respond to getInitialContext tool call', async () => {
    // Clear previous stdout data
    stdoutData = '';
    
    // Prepare MCP request for the getInitialContext tool
    const request = {
      id: '2',
      method: 'callTool',
      params: {
        name: 'getInitialContext',
        arguments: {}
      }
    };
    
    // Send the request to the server
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // Wait for response
    let responseReceived = false;
    let maxAttempts = 50;
    let response;
    
    while (!responseReceived && maxAttempts > 0) {
      await setTimeout(100);
      maxAttempts--;
      
      const match = stdoutData.match(/\{[\s\S]*"content"[\s\S]*\}/);
      if (match) {
        try {
          response = JSON.parse(match[0]);
          responseReceived = true;
        } catch (e) {
          // Not a complete JSON object yet
        }
      }
    }
    
    // Assert the response is correct
    expect(responseReceived).toBe(true);
    expect(response).toBeDefined();
    expect(response.content).toBeInstanceOf(Array);
    
    // We should at least have text content
    const textContent = response.content.find((item: any) => item.type === 'text');
    expect(textContent).toBeDefined();
    
    // Parse the text content as JSON
    const contextData = JSON.parse(textContent.text);
    
    // Check for some expected fields in the context data
    expect(contextData).toHaveProperty('message');
    expect(contextData.message).toContain('Welcome');
  });
}); 