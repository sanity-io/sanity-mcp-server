import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { setTimeout } from 'timers/promises';

/**
 * Integration test for the Echo MCP server
 * 
 * This test spawns the echo server as a child process,
 * sends commands to it via stdin, and verifies the responses from stdout
 */
describe('Echo MCP Server Integration', () => {
  let serverProcess: any;
  let stdoutData = '';
  let serverReady = false;

  // Start the server before tests
  beforeAll(async () => {
    const serverPath = resolve(process.cwd(), 'test-echo-server.js');
    
    serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Collect stdout data
    serverProcess.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdoutData += text;
      
      // Check if server is ready
      if (text.includes('Server connected successfully')) {
        serverReady = true;
      }
    });
    
    // Log stderr for debugging
    serverProcess.stderr.on('data', (data: Buffer) => {
      console.error('Server stderr:', data.toString());
    });
    
    // Wait for server to be ready
    for (let i = 0; i < 50; i++) {
      if (serverReady) break;
      await setTimeout(100);
    }
    
    // Clear stdout data collected during startup
    stdoutData = '';
    
    // Ensure server started properly
    expect(serverReady).toBe(true);
  });
  
  // Cleanup after tests
  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });
  
  // Test the echo tool
  it('should echo back a message', async () => {
    // Prepare MCP request for the echo tool
    const request = {
      id: '123',
      method: 'callTool',
      params: {
        name: 'echo',
        arguments: {
          message: 'Hello from integration test'
        }
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
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toBe('Echo: Hello from integration test');
  });
}); 