/**
 * Helper script to list all available tools
 */
import { getToolDefinitions } from '../../../src/tools/index.js';

// Get all tools
const tools = getToolDefinitions();

// Print all tool names
console.log('Available tools:');
tools.forEach(tool => {
  console.log(`- ${tool.name}`);
});
