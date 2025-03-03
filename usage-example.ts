// This is an example of how an AI agent might use the MCP server through direct stdio

import { spawn } from 'child_process';
import { createClient } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function runExample(): Promise<void> {
  // Spawn the MCP server as a child process
  const serverProcess = spawn('./src/index.js', [], { 
    stdio: ['pipe', 'pipe', process.stderr],
    env: process.env 
  });
  
  // Create an MCP client using StdioClientTransport
  const transport = new StdioClientTransport(serverProcess.stdin, serverProcess.stdout);
  const mcpClient = createClient(transport);
  
  try {
    // Example: List organizations and projects
    console.log('Listing organizations and projects...');
    const orgs = await mcpClient.invoke('listOrganizationsAndProjects', {});
    console.log('Organizations and projects:', orgs);
    
    // Example: Search content
    console.log('\nSearching blog posts...');
    const searchResults = await mcpClient.invoke('searchContent', {
      projectId: 'your-project-id',
      dataset: 'production',
      query: '*[_type == "post" && publishedAt >= "2020-01-01"]{title, body, publishedAt}',
      verifyWithLLM: true
    });
    console.log('Search results:', searchResults);
    
    // Example: Create a release
    console.log('\nCreating a content release...');
    const releaseResult = await mcpClient.invoke('createRelease', {
      projectId: 'your-project-id',
      dataset: 'production',
      releaseId: 'release-1',
      title: 'New feature release'
    });
    console.log('Release created:', releaseResult);
    
  } catch (error) {
    console.error('Error during MCP client operations:', error);
  } finally {
    // Cleanup - make sure to terminate the server process
    serverProcess.kill();
  }
}

// Run the examples
runExample().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
