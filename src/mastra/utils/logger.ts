import { createLogger as createMastraLogger } from '@mastra/core/logger';

/**
 * Create and export a centralized logger instance
 * This avoids circular dependencies when importing the logger
 */
export const logger = createMastraLogger({
  name: 'Mastra',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

/**
 * Re-export the createLogger function for custom loggers
 */
export const createLogger = createMastraLogger;
