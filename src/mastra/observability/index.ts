/**
 * Observability module for Mastra AI
 *
 * This module provides telemetry, logging, and monitoring capabilities
 * for the Mastra AI application.
 */

import { createLogger } from '@mastra/core/logger';

// Create and export a shared logger instance
export const mastraLogger = createLogger({
  name: 'MastraShared',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

// Export telemetry functions and types
export {
  initTelemetry,
  getTracer,
  getMeter,
  llmMetrics,
  recordLLMMetrics
} from './telemetry';

// Export Langfuse integration
export {
  configureLangfuse,
  createTelemetryConfig,
  calculateTokenCost,
  trackLLMUsage
} from './langfuse';

// Export Upstash logger
export {
  createUpstashLogger
} from './upstashLogger';

// Export constants
export * from './constants';

// Export types
export * from './types';
