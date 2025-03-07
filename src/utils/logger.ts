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
 */
export const logger: Logger = {
  info: (...args: unknown[]) => console.error('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  warn: (...args: unknown[]) => console.error('[WARN]', ...args),
  debug: (...args: unknown[]) => console.error('[DEBUG]', ...args)
};

export default logger; 