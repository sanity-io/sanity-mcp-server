/**
 * Custom MCP transport implementation
 * 
 * This enhances the standard StdioServerTransport to ensure
 * proper communication separation between logs and MCP protocol messages.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import logger from './logger.js';

/**
 * Enhanced transport factory that sets up proper event handlers and returns
 * a standard StdioServerTransport instance
 */
export function createEnhancedTransport(): StdioServerTransport {
  // Handle process termination gracefully
  process.on('SIGINT', () => {
    logger.info('Received SIGINT. Shutting down server...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM. Shutting down server...');
    process.exit(0);
  });
  
  // Handle stdout errors
  process.stdout.on('error', (err) => {
    logger.error('Error writing to stdout:', err);
  });
  
  logger.info('Enhanced MCP transport initialized');
  
  // Return a standard StdioServerTransport
  return new StdioServerTransport();
}

// Export a singleton instance for consistency
export const sanityTransport = createEnhancedTransport(); 