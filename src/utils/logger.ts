/**
 * Logger utility that redirects all output to stderr to avoid interfering with MCP JSON communication
 */

/**
 * Logger interface with standard logging methods
 */
export interface Logger {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

/**
 * Logger implementation that redirects all output to stderr
 * This ensures logs don't interfere with the MCP protocol JSON communication on stdou
 */
export const logger: Logger = {
  info: (...args: unknown[]) => console.error('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  warn: (...args: unknown[]) => console.error('[WARN]', ...args),
  debug: (...args: unknown[]) => console.error('[DEBUG]', ...args)
}

/**
 * Special write function for MCP protocol outputs
 * Ensures protocol responses go to stdout while logs go to stderr
 */
export const mcpWrite = (data: string): void => {
  try {
    process.stdout.write(`${data }\n`)
  } catch (err) {
    logger.error('Error writing to stdout:', err)
  }
}

export default logger
