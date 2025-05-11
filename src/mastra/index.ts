import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';

// Create logger instance
export const logger = createLogger({
  name: 'Mastra',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

// We'll import and export agent implementations from their respective modules
// This is done via the export * from './agents' statement below

// Initialize Mastra instance with default configuration and logger
export const mastra = new Mastra({
  logger,
});

// Export core types and constants
export * from './types';
export * from './constants';

// Export all components from their modules
export * from './agents';
export * from './memory';
export * from './embeddings';
export * from './knowledge';