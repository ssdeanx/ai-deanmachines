import { createLogger as createMastraLogger } from '@mastra/core/logger';

/**
 * Logger options interface
 */
export interface LoggerOptions {
  /**
   * Logger name
   * @default 'Mastra'
   */
  name?: string;

  /**
   * Log level
   * @default 'debug' in development, 'info' in production
   */
  level?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Whether to include timestamps in logs
   * @default true
   */
  timestamps?: boolean;

  /**
   * Whether to include trace IDs in logs when available
   * @default true
   */
  includeTraceId?: boolean;

  /**
   * Whether to colorize console output
   * @default true in development, false in production
   */
  colorize?: boolean;

  /**
   * Whether to log to console
   * @default true
   */
  console?: boolean;

  /**
   * Whether to log to file
   * @default false
   */
  file?: boolean;

  /**
   * File path for logs if file logging is enabled
   * @default './logs'
   */
  filePath?: string;

  /**
   * Maximum file size in bytes before rotation
   * @default 10485760 (10MB)
   */
  maxFileSize?: number;

  /**
   * Maximum number of log files to keep
   * @default 5
   */
  maxFiles?: number;

  /**
   * Whether to format logs as JSON
   * @default false in development, true in production
   */
  json?: boolean;

  /**
   * Whether to log to stdout instead of stderr
   * @default true
   */
  stdout?: boolean;

  /**
   * Whether to silence all logs
   * @default false
   */
  silent?: boolean;

  /**
   * Additional metadata to include with all logs
   * @default {}
   */
  defaultMeta?: Record<string, any>;

  /**
   * Additional options to pass to the logger
   */
  [key: string]: any;
}


/**
 * Create a logger with options
 *
 * @param options - Logger options
 * @returns A configured logger instance
 */


export function createLogger(options: LoggerOptions = {}) {
  const {
    name = 'Mastra',
    level = process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestamps = true,
    includeTraceId = true,
    colorize = process.env.NODE_ENV !== 'production',
    console = true,
    file = false,
    filePath = './logs',
    maxFileSize = 10485760, // 10MB
    maxFiles = 5,
    json = process.env.NODE_ENV === 'production',
    stdout = true,
    silent = false,
    defaultMeta = {},
    ...restOptions
  } = options;

  // Create base logger options
  const loggerOptions = {
    name,
    level,
    timestamps,
    includeTraceId,
    colorize,
    console,
    file,
    filePath,
    maxFileSize,
    maxFiles,
    json,
    stdout,
    silent,
    defaultMeta,
    // Pass any additional options
    ...restOptions
  };

  // Create the base logger
  return createMastraLogger(loggerOptions);
}
/**
 * Create and export a centralized logger instance
 * This avoids circular dependencies when importing the logger
 */
export const logger = createLogger({
  name: 'Mastra',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: {
    service: 'mastra-ai',
    version: process.env.npm_package_version || '0.0.1',
  },
});
